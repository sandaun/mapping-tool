import type { RawWorkbook, CellValue } from '../excel/raw';
import type { DeviceSignal, ModbusSignal } from '../deviceSignals';
import type { GenerateSignalsResult, AllocationPolicy } from '@/types/actions';
import { WARNINGS, EXCEL_VALUES, DEVICE_TEMPLATES } from '@/constants/generation';
import { detectUnitFromSignalName } from '../../constants/bacnetUnits';
import { getLastDeviceNumber } from './utils/device';
import { formatBACnetType } from './utils/bacnet';
import {
  getModbusFunctions,
  getModbusFormat,
  calculateModbusDataLength,
  getModbusByteOrder,
} from './utils/modbus';
import { allocateBACnetInstances } from './utils/allocation';
import { mapModbusToBACnetObjectType } from './utils/mapping';
import { createSheetContext, findSignalsSheet } from './utils/common';
import { filterModbusSignals } from './utils/signal-filtering';
import {
  getReadWriteCapabilities,
  getBACnetReadWriteCapabilities,
} from './utils/read-write';

/**
 * Populate BACnet Server columns in a row
 */
const populateBACnetColumns = (
  row: CellValue[],
  modbusSignal: ModbusSignal,
  objectType: string,
  instance: number,
  nextId: number,
  findCol: (name: string) => number
): void => {
  row[findCol('#')] = nextId;
  row[findCol('Active')] = EXCEL_VALUES.ACTIVE_TRUE;
  row[findCol('Description')] = '';
  row[findCol('Name')] = modbusSignal.signalName;
  row[findCol('Type')] = formatBACnetType(objectType);
  row[findCol('Instance')] = instance;

  // Auto-detect units from signal name, fallback to defaults
  let unitCode: number | string;
  if (objectType.startsWith('B')) {
    unitCode = '-1'; // Binary: always -1
  } else if (objectType.startsWith('M')) {
    unitCode = '-1'; // Multistate: always -1
  } else {
    // Analog: try to detect from signal name
    unitCode = detectUnitFromSignalName(modbusSignal.signalName);
  }
  row[findCol('Units')] = unitCode;

  row[findCol('NC')] = EXCEL_VALUES.EMPTY;
  row[findCol('Texts')] = EXCEL_VALUES.EMPTY;
  row[findCol('# States')] = objectType.startsWith('B')
    ? '2'
    : objectType.startsWith('M')
    ? '65535'
    : EXCEL_VALUES.EMPTY;
  row[findCol('Rel. Def.')] = EXCEL_VALUES.EMPTY;
  row[findCol('COV')] = objectType.startsWith('A')
    ? EXCEL_VALUES.DEFAULT_DEADBAND
    : EXCEL_VALUES.EMPTY;
};

/**
 * Populate Modbus Master columns in a row
 */
const populateModbusColumns = (
  row: CellValue[],
  modbusSignal: ModbusSignal,
  modbusFunctions: { read: string; write: string },
  newDeviceNum: number,
  newSlaveId: number,
  nextId: number,
  headers: CellValue[],
  findCol: (name: string) => number
): void => {
  // Find second # column
  const modbusIdCol = headers.findIndex(
    (h, i) => h === '#' && i > findCol('COV')
  );
  if (modbusIdCol >= 0) row[modbusIdCol] = nextId;

  row[findCol('Device')] = DEVICE_TEMPLATES.RTU_PORT_A(newDeviceNum);
  row[findCol('# Slave')] = newSlaveId;
  row[findCol('Base')] = EXCEL_VALUES.BASE_ZERO;
  row[findCol('Read Func')] = modbusFunctions.read;
  row[findCol('Write Func')] = modbusFunctions.write;

  // Modbus format, data length, and byte order
  const format = getModbusFormat(
    modbusSignal.dataType,
    modbusSignal.registerType
  );
  const dataLength = calculateModbusDataLength(
    modbusSignal.registerType,
    modbusSignal.dataType
  );
  const byteOrder = getModbusByteOrder(modbusSignal.registerType);

  row[findCol('Data Length')] = dataLength;
  row[findCol('Format')] = format;
  row[findCol('ByteOrder')] = byteOrder;
  row[findCol('Address')] = modbusSignal.address;
  row[findCol('Bit')] = EXCEL_VALUES.EMPTY;
  row[findCol('# Bits')] = EXCEL_VALUES.EMPTY;
  row[findCol('Deadband')] = EXCEL_VALUES.DEFAULT_DEADBAND;
  row[findCol('Conv. Id')] = '';
  row[findCol('Conversions')] = EXCEL_VALUES.EMPTY;
};

/**
 * Generate BACnet signals from Modbus device signals.
 * Gateway: BACnet Server ← Modbus Master
 */
export function generateBACnetFromModbus(
  deviceSignals: DeviceSignal[],
  rawWorkbook: RawWorkbook,
  policy: AllocationPolicy = 'simple'
): GenerateSignalsResult {
  const warnings: string[] = [];
  let rowsAdded = 0;

  // Find Signals sheet
  const signalsSheet = findSignalsSheet(rawWorkbook);
  if (!signalsSheet) {
    warnings.push(WARNINGS.SIGNALS_SHEET_NOT_FOUND);
    return { updatedWorkbook: rawWorkbook, rowsAdded: 0, warnings };
  }

  // Create sheet context with helpers
  const ctx = createSheetContext(signalsSheet);
  const { findCol, getMaxNumericInColumn, createEmptyRow, headers } = ctx;

  // Get the next # value (sequential ID)
  let nextId = ctx.getNextId();

  // Detect last device number to auto-increment
  const lastDeviceNum = getLastDeviceNumber(signalsSheet);
  const newDeviceNum = lastDeviceNum + 1;
  const newSlaveId = 10 + newDeviceNum; // Slave ID = 10 + device number

  // Filter Modbus signals (type-safe, NO 'as')
  const modbusSignals = filterModbusSignals(deviceSignals);

  // Device signals = Modbus → Generate BACnet columns
  const instanceAllocation = allocateBACnetInstances(modbusSignals, policy);
  const lastInstance = getMaxNumericInColumn('Instance');
  const baseInstance = lastInstance >= 0 ? lastInstance : 0;

  for (const modbusSignal of modbusSignals) {
    const signalId = `${modbusSignal.deviceId}_${modbusSignal.signalName}`;

    // Calculate signal properties
    const objectType = mapModbusToBACnetObjectType(
      modbusSignal.dataType,
      modbusSignal.registerType
    );
    const instance = (instanceAllocation.get(signalId) ?? 1) + baseInstance;

    // Determine read/write capabilities
    const { isReadable, isWritable } = getReadWriteCapabilities(
      modbusSignal,
      () => getBACnetReadWriteCapabilities(objectType)
    );

    const modbusFunctions = getModbusFunctions(
      modbusSignal.registerType,
      isReadable,
      isWritable
    );

    // Build row with all required columns
    const row = createEmptyRow();

    // Populate BACnet and Modbus columns
    populateBACnetColumns(row, modbusSignal, objectType, instance, nextId, findCol);
    populateModbusColumns(
      row,
      modbusSignal,
      modbusFunctions,
      newDeviceNum,
      newSlaveId,
      nextId,
      headers,
      findCol
    );

    signalsSheet.rows.push(row);
    rowsAdded++;
    nextId++;
  }

  return { updatedWorkbook: rawWorkbook, rowsAdded, warnings };
}
