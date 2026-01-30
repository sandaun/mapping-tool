import type { RawWorkbook, CellValue } from '../excel/raw';
import type { DeviceSignal } from '../deviceSignals';
import type {
  GenerateSignalsResult,
  KNXGenerationPolicy,
} from '@/types/actions';
import {
  WARNINGS,
  EXCEL_VALUES,
  DEVICE_TEMPLATES,
} from '@/constants/generation';
import { getLastDeviceNumber } from './utils/device';
import {
  getModbusFunctions,
  getModbusFormat,
  calculateModbusDataLength,
  getModbusByteOrder,
} from './utils/modbus';
import { modbusTypeToKNXDPT } from './utils/mapping';
import {
  parseGroupAddress,
  formatGroupAddress,
  incrementGroupAddress,
  getDefaultKNXFlags,
  DEFAULT_KNX_PRIORITY,
  type GroupAddress,
} from './utils/knx';
import { createSheetContext, findSignalsSheet } from './utils/common';
import { filterModbusSignals } from './utils/signal-filtering';
import {
  getReadWriteCapabilities,
  getModbusReadWriteFallback,
} from './utils/read-write';
import type { ModbusSignal } from '../deviceSignals';

/**
 * Populate KNX columns in a row
 */
const populateKNXColumns = (
  row: CellValue[],
  modbusSignal: ModbusSignal,
  dpt: string,
  groupAddress: GroupAddress,
  flags: { U: boolean; T: boolean; Ri: boolean; W: boolean; R: boolean },
  nextId: number,
  findCol: (name: string) => number,
): void => {
  row[findCol('#')] = nextId;
  row[findCol('Active')] = EXCEL_VALUES.ACTIVE_TRUE;
  row[findCol('Description')] = modbusSignal.signalName;
  row[findCol('DPT')] = dpt;
  row[findCol('Group Address')] = formatGroupAddress(groupAddress);
  row[findCol('Additional Addresses')] = EXCEL_VALUES.EMPTY_KNX;
  row[findCol('U')] = flags.U ? 'U' : EXCEL_VALUES.EMPTY_KNX;
  row[findCol('T')] = flags.T ? 'T' : EXCEL_VALUES.EMPTY_KNX;
  row[findCol('Ri')] = flags.Ri ? 'Ri' : EXCEL_VALUES.EMPTY_KNX;
  row[findCol('W')] = flags.W ? 'W' : EXCEL_VALUES.EMPTY_KNX;
  row[findCol('R')] = flags.R ? 'R' : EXCEL_VALUES.EMPTY_KNX;
  row[findCol('Priority')] = DEFAULT_KNX_PRIORITY;
};

/**
 * Populate Modbus Master columns in a row
 */
const populateModbusColumns = (
  row: CellValue[],
  modbusSignal: ModbusSignal,
  modbusFunctions: { read: string; write: string },
  dataLengthStr: string,
  format: string,
  newDeviceNum: number,
  newSlaveId: number,
  nextId: number,
  headers: CellValue[],
  findCol: (name: string) => number,
): void => {
  // Find second # column
  const modbusIdCol = headers.findIndex(
    (h, i) => h === '#' && i > findCol('Priority'),
  );
  if (modbusIdCol >= 0) row[modbusIdCol] = nextId;

  row[findCol('Device')] = DEVICE_TEMPLATES.RTU_PORT_B(newDeviceNum);
  row[findCol('# Slave')] = newSlaveId;
  row[findCol('Base')] = EXCEL_VALUES.BASE_ZERO;
  row[findCol('Read Func')] = modbusFunctions.read;
  row[findCol('Write Func')] = modbusFunctions.write;
  row[findCol('Data Length')] = dataLengthStr;
  row[findCol('Format')] = format;
  row[findCol('ByteOrder')] = getModbusByteOrder(modbusSignal.registerType);
  row[findCol('Address')] = modbusSignal.address;
  row[findCol('Bit')] = EXCEL_VALUES.EMPTY_KNX;
  row[findCol('# Bits')] = EXCEL_VALUES.EMPTY_KNX;
  row[findCol('Deadband')] = EXCEL_VALUES.DEFAULT_DEADBAND;
  row[findCol('Conv. Id')] = EXCEL_VALUES.EMPTY_KNX;
  row[findCol('Conversions')] = EXCEL_VALUES.EMPTY_KNX;
};

/**
 * Generate KNX signals from Modbus device signals.
 * Gateway: KNX ← Modbus Master
 * Template: knx-to-modbus-master.xlsx
 */
export function generateKNXFromModbus(
  deviceSignals: DeviceSignal[],
  rawWorkbook: RawWorkbook,
  policy: KNXGenerationPolicy = {},
): GenerateSignalsResult {
  const warnings: string[] = [];
  let rowsAdded = 0;

  // Deep clone the workbook to ensure React detects changes
  const updatedWorkbook = JSON.parse(
    JSON.stringify(rawWorkbook),
  ) as RawWorkbook;

  // Find Signals sheet
  const signalsSheet = findSignalsSheet(updatedWorkbook);
  if (!signalsSheet) {
    warnings.push(WARNINGS.SIGNALS_SHEET_NOT_FOUND);
    return { updatedWorkbook, rowsAdded: 0, warnings };
  }

  // Create sheet context with headers and helper functions
  const { headers, headerRowIdx, findCol } = createSheetContext(signalsSheet);

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
        `Invalid startGroupAddress: ${policy.startGroupAddress}. Using next available address.`,
      );
      groupAddress = getNextGroupAddressFromSheet();
    }
  } else {
    groupAddress = getNextGroupAddressFromSheet();
  }

  // Filter Modbus signals (type-safe, no 'as' assertion)
  const modbusSignals = filterModbusSignals(deviceSignals);

  // Process each Modbus signal
  for (const modbusSignal of modbusSignals) {
    // Determine signal read/write capabilities
    const isCoil = modbusSignal.registerType === 'Coil';
    const isDiscreteInput = modbusSignal.registerType === 'DiscreteInput';

    const { isReadable, isWritable } = getReadWriteCapabilities(
      modbusSignal,
      () => getModbusReadWriteFallback(modbusSignal.registerType),
    );

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

    // Calculate data length and format using Modbus utils
    const dataLengthStr = calculateModbusDataLength(
      modbusSignal.registerType,
      modbusSignal.dataType,
    );
    const dataLength = parseInt(dataLengthStr, 10);
    const format = getModbusFormat(
      modbusSignal.dataType,
      modbusSignal.registerType,
    );
    const dpt = modbusTypeToKNXDPT(
      signalCategory,
      dataLength,
      modbusSignal.dataType, // Pass original dataType instead of format
      modbusSignal.units,
    );

    // Generate KNX flags
    const flags = getDefaultKNXFlags(isReadable, isWritable);

    // Get Modbus functions
    const modbusFunctions = getModbusFunctions(
      modbusSignal.registerType,
      isReadable,
      isWritable,
    );

    // Build row with all required columns
    const row: CellValue[] = new Array(headers.length).fill(null);

    populateKNXColumns(
      row,
      modbusSignal,
      dpt,
      groupAddress,
      flags,
      nextId,
      findCol,
    );
    populateModbusColumns(
      row,
      modbusSignal,
      modbusFunctions,
      dataLengthStr,
      format,
      newDeviceNum,
      newSlaveId,
      nextId,
      headers,
      findCol,
    );

    signalsSheet.rows.push(row);
    rowsAdded++;
    nextId++;

    // Increment Group Address for next signal
    try {
      groupAddress = incrementGroupAddress(groupAddress);
    } catch {
      warnings.push(
        `Group address overflow at signal ${modbusSignal.signalName}. Stopping generation.`,
      );
      break;
    }
  }

  return { updatedWorkbook, rowsAdded, warnings };
}
