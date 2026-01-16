import type { RawWorkbook, CellValue } from '../excel/raw';
import type { DeviceSignal, BACnetSignal } from '../deviceSignals';
import { findHeaderRowIndex } from './utils/headers';
import { getLastDeviceNumberSimple } from './utils/device';
import { formatBACnetType } from './utils/bacnet';
import { getModbusFormat, getModbusReadWrite } from './utils/modbus';
import {
  allocateModbusAddresses,
  type AllocationPolicy,
} from './utils/allocation';
import { mapBACnetToModbusDataType } from './utils/mapping';

export type GenerateSignalsResult = {
  updatedWorkbook: RawWorkbook;
  rowsAdded: number;
  warnings: string[];
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
  policy: AllocationPolicy = 'simple'
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

  const getMaxNumericInColumn = (colName: string): number => {
    const colIdx = findCol(colName);
    if (colIdx < 0) return -1;

    let max = -1;
    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
    for (let i = startRow; i < signalsSheet.rows.length; i++) {
      const cell = signalsSheet.rows[i][colIdx];
      const value =
        typeof cell === 'number'
          ? cell
          : typeof cell === 'string'
          ? Number(cell)
          : NaN;
      if (!Number.isNaN(value)) {
        max = Math.max(max, value);
      }
    }
    return max;
  };

  // Get the next # value (sequential ID)
  let nextId =
    signalsSheet.rows.length - (headerRowIdx >= 0 ? headerRowIdx : 0);

  // Detect last Device number to auto-increment
  const lastDeviceNum = getLastDeviceNumberSimple(signalsSheet);
  const newDeviceNum = lastDeviceNum + 1;

  // Device signals = BACnet → Generate Modbus columns
  const addressAllocation = allocateModbusAddresses(deviceSignals, policy);
  const lastAddress = getMaxNumericInColumn('Address');
  const baseAddress = lastAddress >= 0 ? lastAddress + 1 : 0;

  for (const sig of deviceSignals) {
    if (!('objectType' in sig)) continue; // Skip non-BACnet signals

    const bacnetSignal = sig as BACnetSignal;
    const signalId = `${bacnetSignal.deviceId}_${bacnetSignal.signalName}`;

    const dataType = mapBACnetToModbusDataType(bacnetSignal.objectType);
    const address = (addressAllocation.get(signalId) ?? 0) + baseAddress;

    // Determine Read/Write based on BACnet object type
    // 0: Read (INPUT), 1: Trigger (OUTPUT), 2: Read / Write (VALUE)
    const readWrite = getModbusReadWrite(bacnetSignal.objectType);

    // Build row with 15 columns (Modbus Slave template structure)
    const row: CellValue[] = new Array(headers.length).fill(null);

    // Modbus columns (internal protocol - Modbus Slave exposes these)
    row[findCol('#')] = nextId;
    row[findCol('Active')] = 'True';
    row[findCol('Description')] = bacnetSignal.description || '';
    row[findCol('Data Length')] = dataType.includes('32') ? '32' : '16';
    row[findCol('Format')] = getModbusFormat(dataType, bacnetSignal.objectType);
    row[findCol('Address')] = address;
    row[findCol('Bit')] = bacnetSignal.objectType === 'BV' ? '0' : '-';
    row[findCol('Read / Write')] = readWrite;
    row[findCol('String Length')] = '-';

    // BACnet columns (external protocol - BACnet Client reads these)
    const bacnetIdCol = headers.findIndex(
      (h, i) => h === '#' && i > findCol('String Length')
    );
    if (bacnetIdCol >= 0) row[bacnetIdCol] = nextId;
    row[findCol('Device Name')] = `Device ${newDeviceNum}`;
    row[findCol('Type')] = formatBACnetType(bacnetSignal.objectType);
    row[findCol('Instance')] = bacnetSignal.instance;
    row[findCol('Conv. Id')] = '';
    row[findCol('Conversions')] = '-';

    signalsSheet.rows.push(row);
    rowsAdded++;
    nextId++;
  }

  return { updatedWorkbook: rawWorkbook, rowsAdded, warnings };
}
