import type { RawWorkbook, CellValue } from '../excel/raw';
import type { DeviceSignal, ModbusSignal } from '../deviceSignals';
import { findHeaderRowIndex } from './utils/headers';
import { getLastDeviceNumber } from './utils/device';
import { getModbusFunctions, getModbusFormat } from './utils/modbus';
import { modbusTypeToKNXDPT } from './utils/mapping';
import {
  parseGroupAddress,
  formatGroupAddress,
  incrementGroupAddress,
  getDefaultKNXFlags,
  DEFAULT_KNX_PRIORITY,
  type GroupAddress,
} from './utils/knx';

export type GenerateSignalsResult = {
  updatedWorkbook: RawWorkbook;
  rowsAdded: number;
  warnings: string[];
};

export interface KNXGenerationPolicy {
  startGroupAddress?: string; // Default: "0/0/1"
  deviceNumber?: number; // Auto-detect if not provided
  slaveId?: number; // Auto-detect if not provided
}

/**
 * Generate KNX signals from Modbus device signals.
 * Gateway: KNX ← Modbus Master
 * Template: knx-to-modbus-master.xlsx
 */
export function generateKNXFromModbus(
  deviceSignals: DeviceSignal[],
  rawWorkbook: RawWorkbook,
  policy: KNXGenerationPolicy = {}
): GenerateSignalsResult {
  const warnings: string[] = [];
  let rowsAdded = 0;

  // Find Signals sheet
  const signalsSheet = rawWorkbook.sheets.find((s) => s.name === 'Signals');
  if (!signalsSheet) {
    warnings.push("No s'ha trobat el sheet 'Signals'.");
    return { updatedWorkbook: rawWorkbook, rowsAdded: 0, warnings };
  }

  // Find where the actual headers are
  const headerRowIdx = findHeaderRowIndex(signalsSheet);
  const headers =
    headerRowIdx >= 0 ? signalsSheet.rows[headerRowIdx] : signalsSheet.headers;

  // Helper to find column index by exact name
  const findCol = (name: string): number => {
    const idx = headers.findIndex((h) => h === name);
    return idx;
  };

  // Get the next # value (sequential ID)
  let nextId =
    signalsSheet.rows.length - (headerRowIdx >= 0 ? headerRowIdx : 0);

  // Detect last device number to auto-increment
  const lastDeviceNum = getLastDeviceNumber(signalsSheet);
  const newDeviceNum = policy.deviceNumber ?? lastDeviceNum + 1;
  const newSlaveId = policy.slaveId ?? 10 + newDeviceNum;

  // Initialize Group Address counter
  let groupAddress: GroupAddress;
  try {
    groupAddress = parseGroupAddress(policy.startGroupAddress ?? '0/0/1');
  } catch {
    warnings.push(
      `Invalid startGroupAddress: ${policy.startGroupAddress}. Using default 0/0/1.`
    );
    groupAddress = { main: 0, middle: 0, sub: 1 };
  }

  // Process each Modbus signal
  for (const sig of deviceSignals) {
    if (!('registerType' in sig)) continue; // Skip non-Modbus signals

    const modbusSignal = sig as ModbusSignal;

    // Determine signal read/write capabilities
    const isCoil = modbusSignal.registerType === 'Coil';
    const isDiscreteInput = modbusSignal.registerType === 'DiscreteInput';
    const isHoldingRegister = modbusSignal.registerType === 'HoldingRegister';
    const isInputRegister = modbusSignal.registerType === 'InputRegister';

    const isReadable = isDiscreteInput || isInputRegister || isHoldingRegister;
    const isWritable = isCoil || isHoldingRegister;

    // Map Modbus signal to KNX DPT
    let signalType: 'AI' | 'AO' | 'DI' | 'DO' | 'Multistate';
    if (isCoil || isDiscreteInput) {
      signalType = isWritable ? 'DO' : 'DI';
    } else if (modbusSignal.dataType === 'Multistate') {
      signalType = 'Multistate';
    } else {
      signalType = isWritable ? 'AO' : 'AI';
    }

    const dataLength =
      modbusSignal.registerType === 'Coil' ||
      modbusSignal.registerType === 'DiscreteInput'
        ? 1
        : 16;
    const format = getModbusFormat(modbusSignal.dataType);
    const dpt = modbusTypeToKNXDPT(
      signalType,
      dataLength,
      format,
      modbusSignal.units
    );

    // Generate KNX flags
    const flags = getDefaultKNXFlags(isReadable, isWritable);

    // Get Modbus functions
    const modbusFunctions = getModbusFunctions(
      modbusSignal.registerType,
      isReadable,
      isWritable
    );

    // Build row with all required columns
    const row: CellValue[] = new Array(headers.length).fill(null);

    // KNX Internal columns
    row[findCol('#')] = nextId;
    row[findCol('Active')] = 'True';
    row[findCol('Description')] = modbusSignal.signalName;
    row[findCol('DPT')] = dpt;
    row[findCol('Group Address')] = formatGroupAddress(groupAddress);
    row[findCol('Additional Addresses')] = '';
    row[findCol('U')] = flags.U ? 'U' : '';
    row[findCol('T')] = flags.T ? 'T' : '';
    row[findCol('Ri')] = flags.Ri ? 'Ri' : '';
    row[findCol('W')] = flags.W ? 'W' : '';
    row[findCol('R')] = flags.R ? 'R' : '';
    row[findCol('Priority')] = DEFAULT_KNX_PRIORITY;

    // Modbus Master External columns (second #)
    const modbusIdCol = headers.findIndex(
      (h, i) => h === '#' && i > findCol('Priority')
    );
    if (modbusIdCol >= 0) row[modbusIdCol] = nextId;
    row[findCol('Device')] = `RTU // Port B // Device ${newDeviceNum}`;
    row[findCol('# Slave')] = newSlaveId;
    row[findCol('Base')] = '0-based';
    row[findCol('Read Func')] = modbusFunctions.read;
    row[findCol('Write Func')] = modbusFunctions.write;

    // Data Length: 1 for Coil/DiscreteInput, 32 for Float32, 16 otherwise
    let dataLengthValue: string;
    if (
      modbusSignal.registerType === 'Coil' ||
      modbusSignal.registerType === 'DiscreteInput'
    ) {
      dataLengthValue = '1';
    } else if (format === '3: Float') {
      dataLengthValue = '32'; // Float32 = 32 bits = 2 registers
    } else {
      dataLengthValue = '16'; // Int16, Uint16 = 16 bits = 1 register
    }
    row[findCol('Data Length')] = dataLengthValue;

    row[findCol('Format')] =
      modbusSignal.registerType === 'Coil' ||
      modbusSignal.registerType === 'DiscreteInput'
        ? '-'
        : format;
    row[findCol('ByteOrder')] =
      modbusSignal.registerType === 'Coil' ||
      modbusSignal.registerType === 'DiscreteInput'
        ? '-'
        : '0: Big Endian';
    row[findCol('Address')] = modbusSignal.address;
    row[findCol('Bit')] = '-';
    row[findCol('# Bits')] = '-';
    row[findCol('Deadband')] = '0';
    row[findCol('Conv. Id')] = '';
    row[findCol('Conversions')] = '-';

    signalsSheet.rows.push(row);
    rowsAdded++;
    nextId++;

    // Increment Group Address for next signal
    try {
      groupAddress = incrementGroupAddress(groupAddress);
    } catch {
      warnings.push(
        `Group address overflow at signal ${modbusSignal.signalName}. Stopping generation.`
      );
      break;
    }
  }

  return { updatedWorkbook: rawWorkbook, rowsAdded, warnings };
}
