import type { RawWorkbook, CellValue } from '../excel/raw';
import type { DeviceSignal } from '../deviceSignals';
import type { GenerateSignalsResult, AllocationPolicy } from '@/types/actions';
import {
  WARNINGS,
  EXCEL_VALUES,
  DEVICE_TEMPLATES,
} from '@/constants/generation';
import { getLastDeviceNumberSimple } from './utils/device';
import { formatBACnetType } from './utils/bacnet';
import { getModbusFormat, getModbusReadWrite } from './utils/modbus';
import { allocateModbusAddresses } from './utils/allocation';
import { mapBACnetToModbusDataType } from './utils/mapping';
import { createSheetContext, findSignalsSheet } from './utils/common';
import { filterBACnetSignals } from './utils/signal-filtering';
import type { BACnetSignal } from '../deviceSignals';

/**
 * Populate Modbus Slave columns in a row
 */
const populateModbusColumns = (
  row: CellValue[],
  bacnetSignal: BACnetSignal,
  dataType: string,
  address: number,
  readWrite: string,
  nextId: number,
  findCol: (name: string) => number,
): void => {
  row[findCol('#')] = nextId;
  row[findCol('Active')] = EXCEL_VALUES.ACTIVE_TRUE;
  row[findCol('Description')] =
    bacnetSignal.description || EXCEL_VALUES.EMPTY_KNX;
  row[findCol('Data Length')] = dataType.includes('32') ? '32' : '16';
  row[findCol('Format')] = getModbusFormat(dataType, bacnetSignal.objectType);
  row[findCol('Address')] = address;
  row[findCol('Bit')] =
    bacnetSignal.objectType === 'BV' ? '0' : EXCEL_VALUES.EMPTY_KNX;
  row[findCol('Read / Write')] = readWrite;
  row[findCol('String Length')] = EXCEL_VALUES.EMPTY_KNX;
};

/**
 * Populate BACnet Client columns in a row
 */
const populateBACnetColumns = (
  row: CellValue[],
  bacnetSignal: BACnetSignal,
  newDeviceNum: number,
  nextId: number,
  headers: CellValue[],
  findCol: (name: string) => number,
): void => {
  // Find second # column
  const bacnetIdCol = headers.findIndex(
    (h, i) => h === '#' && i > findCol('String Length'),
  );
  if (bacnetIdCol >= 0) row[bacnetIdCol] = nextId;

  row[findCol('Device Name')] = DEVICE_TEMPLATES.DEVICE(newDeviceNum);
  row[findCol('Type')] = formatBACnetType(bacnetSignal.objectType);
  row[findCol('Instance')] = bacnetSignal.instance;
  row[findCol('Conv. Id')] = EXCEL_VALUES.EMPTY_KNX;
  row[findCol('Conversions')] = EXCEL_VALUES.EMPTY_KNX;
};

/**
 * Generate Modbus signals from BACnet device signals.
 * Gateway: Modbus Slave ← BACnet Client
 *
 * Template structure (15 columns):
 * - Modbus (internal): #, Active, Description, Data Length, Format, Address, Bit, Read/Write, String Length
 * - BACnet (external): #, Device Name, Type, Instance, Conv. Id, Conversions
 */
export function generateModbusFromBACnet(
  deviceSignals: DeviceSignal[],
  rawWorkbook: RawWorkbook,
  policy: AllocationPolicy = 'simple',
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
  const { headers, headerRowIdx, findCol, getMaxNumericInColumn } =
    createSheetContext(signalsSheet);

  // Get the next # value (sequential ID)
  let nextId =
    signalsSheet.rows.length - (headerRowIdx >= 0 ? headerRowIdx : 0);

  // Detect last Device number to auto-increment
  const lastDeviceNum = getLastDeviceNumberSimple(signalsSheet);
  const newDeviceNum = lastDeviceNum + 1;

  // Filter BACnet signals (type-safe, no 'as' assertion)
  const bacnetSignals = filterBACnetSignals(deviceSignals);

  // Device signals = BACnet → Generate Modbus columns
  const addressAllocation = allocateModbusAddresses(bacnetSignals, policy);
  const lastAddress = getMaxNumericInColumn('Address');
  const baseAddress = lastAddress >= 0 ? lastAddress + 1 : 0;

  for (const bacnetSignal of bacnetSignals) {
    const signalId = `${bacnetSignal.deviceId}_${bacnetSignal.signalName}`;

    const dataType = mapBACnetToModbusDataType(bacnetSignal.objectType);
    const address = (addressAllocation.get(signalId) ?? 0) + baseAddress;

    // Determine Read/Write based on BACnet object type
    // 0: Read (INPUT), 1: Trigger (OUTPUT), 2: Read / Write (VALUE)
    const readWrite = getModbusReadWrite(bacnetSignal.objectType);

    // Build row with 15 columns (Modbus Slave template structure)
    const row: CellValue[] = new Array(headers.length).fill(null);

    populateModbusColumns(
      row,
      bacnetSignal,
      dataType,
      address,
      readWrite,
      nextId,
      findCol,
    );
    populateBACnetColumns(
      row,
      bacnetSignal,
      newDeviceNum,
      nextId,
      headers,
      findCol,
    );

    signalsSheet.rows.push(row);
    rowsAdded++;
    nextId++;
  }

  return { updatedWorkbook, rowsAdded, warnings };
}
