import type { RawWorkbook, CellValue } from '../excel/raw';
import type { DeviceSignal, ModbusSignal } from '../deviceSignals';
import type { GenerateSignalsResult, KNXGenerationPolicy } from '@/types/actions';
import { WARNINGS, EXCEL_VALUES, DEVICE_TEMPLATES } from '@/constants/generation';
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
    warnings.push(WARNINGS.SIGNALS_SHEET_NOT_FOUND);
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

  const getNextGroupAddressFromSheet = (): GroupAddress => {
    const colIdx = findCol('Group Address');
    if (colIdx < 0) return { main: 0, middle: 0, sub: 1 };

    let maxValue = -1;
    let maxAddress: GroupAddress | null = null;
    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

    for (let i = startRow; i < signalsSheet.rows.length; i++) {
      const cell = signalsSheet.rows[i][colIdx];
      if (typeof cell !== 'string') continue;
      try {
        const parsed = parseGroupAddress(cell);
        const value = (parsed.main << 11) + (parsed.middle << 8) + parsed.sub;
        if (value > maxValue) {
          maxValue = value;
          maxAddress = parsed;
        }
      } catch {
        // Ignore invalid group addresses in existing rows
      }
    }

    return maxAddress
      ? incrementGroupAddress(maxAddress)
      : { main: 0, middle: 0, sub: 1 };
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
  if (policy.startGroupAddress) {
    try {
      groupAddress = parseGroupAddress(policy.startGroupAddress);
    } catch {
      warnings.push(
        `Invalid startGroupAddress: ${policy.startGroupAddress}. Using next available address.`
      );
      groupAddress = getNextGroupAddressFromSheet();
    }
  } else {
    groupAddress = getNextGroupAddressFromSheet();
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

    // Use mode if available, otherwise fallback to registerType heuristics
    let isReadable: boolean;
    let isWritable: boolean;

    if (modbusSignal.mode) {
      const mode = modbusSignal.mode.toUpperCase();
      isReadable = mode.includes('R');
      isWritable = mode.includes('W');
    } else {
      // Fallback: use registerType heuristics
      isReadable = isDiscreteInput || isInputRegister || isHoldingRegister;
      isWritable = isCoil || isHoldingRegister;
    }

    // Map Modbus signal to KNX DPT
    let signalCategory:
      | 'AnalogInput'
      | 'AnalogOutput'
      | 'DigitalInput'
      | 'DigitalOutput'
      | 'Multistate';
    if (isCoil || isDiscreteInput) {
      signalCategory = isWritable ? 'DigitalOutput' : 'DigitalInput';
    } else if (modbusSignal.dataType === 'Multistate') {
      signalCategory = 'Multistate';
    } else {
      signalCategory = isWritable ? 'AnalogOutput' : 'AnalogInput';
    }

    // Calculate data length based on dataType
    let dataLength: number;
    if (
      modbusSignal.registerType === 'Coil' ||
      modbusSignal.registerType === 'DiscreteInput'
    ) {
      dataLength = 1;
    } else if (/32/.test(modbusSignal.dataType)) {
      dataLength = 32; // Uint32, Int32, Float32 → 32 bits
    } else {
      dataLength = 16; // Uint16, Int16 → 16 bits
    }

    const format = getModbusFormat(modbusSignal.dataType);
    const dpt = modbusTypeToKNXDPT(
      signalCategory,
      dataLength,
      modbusSignal.dataType, // Pass original dataType instead of format
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
    row[findCol('Active')] = EXCEL_VALUES.ACTIVE_TRUE;
    row[findCol('Description')] = modbusSignal.signalName;
    row[findCol('DPT')] = dpt;
    row[findCol('Group Address')] = formatGroupAddress(groupAddress);
    row[findCol('Additional Addresses')] = EXCEL_VALUES.EMPTY;
    row[findCol('U')] = flags.U ? 'U' : EXCEL_VALUES.EMPTY;
    row[findCol('T')] = flags.T ? 'T' : EXCEL_VALUES.EMPTY;
    row[findCol('Ri')] = flags.Ri ? 'Ri' : EXCEL_VALUES.EMPTY;
    row[findCol('W')] = flags.W ? 'W' : EXCEL_VALUES.EMPTY;
    row[findCol('R')] = flags.R ? 'R' : EXCEL_VALUES.EMPTY;
    row[findCol('Priority')] = DEFAULT_KNX_PRIORITY;

    // Modbus Master External columns (second #)
    const modbusIdCol = headers.findIndex(
      (h, i) => h === '#' && i > findCol('Priority')
    );
    if (modbusIdCol >= 0) row[modbusIdCol] = nextId;
    row[findCol('Device')] = DEVICE_TEMPLATES.RTU_PORT_B(newDeviceNum);
    row[findCol('# Slave')] = newSlaveId;
    row[findCol('Base')] = EXCEL_VALUES.BASE_ZERO;
    row[findCol('Read Func')] = modbusFunctions.read;
    row[findCol('Write Func')] = modbusFunctions.write;

    // Data Length: 1 for Coil/DiscreteInput, 32 for Float32, 16 otherwise
    let dataLengthValue: string;
    if (
      modbusSignal.registerType === 'Coil' ||
      modbusSignal.registerType === 'DiscreteInput'
    ) {
      dataLengthValue = '1';
    } else if (
      format === '3: Float' ||
      /32/.test(modbusSignal.dataType)
    ) {
      dataLengthValue = '32'; // Float32 = 32 bits = 2 registers
    } else {
      dataLengthValue = '16'; // Int16, Uint16 = 16 bits = 1 register
    }
    row[findCol('Data Length')] = dataLengthValue;

    row[findCol('Format')] =
      modbusSignal.registerType === 'Coil' ||
      modbusSignal.registerType === 'DiscreteInput'
        ? EXCEL_VALUES.EMPTY
        : format;
    row[findCol('ByteOrder')] =
      modbusSignal.registerType === 'Coil' ||
      modbusSignal.registerType === 'DiscreteInput'
        ? EXCEL_VALUES.EMPTY
        : EXCEL_VALUES.BYTE_ORDER_BIG_ENDIAN;
    row[findCol('Address')] = modbusSignal.address;
    row[findCol('Bit')] = EXCEL_VALUES.EMPTY;
    row[findCol('# Bits')] = EXCEL_VALUES.EMPTY;
    row[findCol('Deadband')] = EXCEL_VALUES.DEFAULT_DEADBAND;
    row[findCol('Conv. Id')] = EXCEL_VALUES.EMPTY;
    row[findCol('Conversions')] = EXCEL_VALUES.EMPTY;

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
