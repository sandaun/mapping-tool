import type { RawWorkbook, CellValue } from '../excel/raw';
import type { DeviceSignal, KNXSignal } from '../deviceSignals';
import { findHeaderRowIndex } from './utils/headers';
import { formatDPT } from '../../constants/knxDPTs';
import { getDefaultKNXFlags, DEFAULT_KNX_PRIORITY } from './utils/knx';
import {
  knxDPTToModbusDataLength,
  knxDPTToModbusFormat,
} from './utils/mapping';

export type GenerateSignalsResult = {
  updatedWorkbook: RawWorkbook;
  rowsAdded: number;
  warnings: string[];
};

export type AllocationPolicy = {
  startAddress?: number; // Starting Modbus address (default: 0)
};

/**
 * Generate Modbus signals from KNX signals (imported from ETS CSV).
 * Gateway: Modbus Slave ← KNX
 *
 * Template structure (21 columns):
 * - Modbus (internal): #, Active, Description, Data Length, Format, Address, Bit, Read/Write, String Length
 * - KNX (external): #, DPT, Group Address, Additional Addresses, U, T, Ri, W, R, Priority, Conv. Id, Conversions
 */
export function generateModbusFromKNX(
  deviceSignals: DeviceSignal[],
  rawWorkbook: RawWorkbook,
  policy: AllocationPolicy = {}
): GenerateSignalsResult {
  const warnings: string[] = [];
  let rowsAdded = 0;

  // Filter only KNX signals
  const knxSignals = deviceSignals.filter(
    (sig): sig is KNXSignal => 'groupAddress' in sig && 'dpt' in sig
  );

  if (knxSignals.length === 0) {
    warnings.push('No hi ha signals KNX per processar.');
    return { updatedWorkbook: rawWorkbook, rowsAdded: 0, warnings };
  }

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

  // Modbus address counter
  let modbusAddress = policy.startAddress ?? 0;

  // Process each KNX signal
  for (const knxSignal of knxSignals) {
    // Normalize DPT to include name (e.g., "1.001: switch")
    const dptFormatted = formatDPT(knxSignal.dpt);

    // Determine Modbus columns from DPT
    const dataLength = knxDPTToModbusDataLength(knxSignal.dpt);
    const format = knxDPTToModbusFormat(knxSignal.dpt);

    // Determine Read/Write based on signal name semantics
    // If name contains "Status", "Feedback", "Read" → 0: Read
    // If name contains "Write", "Command", "Set" → 1: Trigger
    // Otherwise → 2: Read / Write
    const nameLower = knxSignal.signalName.toLowerCase();
    let readWrite = '2: Read / Write'; // Default
    if (
      nameLower.includes('status') ||
      nameLower.includes('feedback') ||
      nameLower.includes('read')
    ) {
      readWrite = '0: Read';
    } else if (
      nameLower.includes('write') ||
      nameLower.includes('command') ||
      nameLower.includes('set')
    ) {
      readWrite = '1: Trigger';
    }

    // Determine KNX flags based on read/write semantics
    const isReadable =
      readWrite === '0: Read' || readWrite === '2: Read / Write';
    const isWritable =
      readWrite === '1: Trigger' || readWrite === '2: Read / Write';
    const flags = getDefaultKNXFlags(isReadable, isWritable);

    // Build row with 21 columns
    const row: CellValue[] = new Array(headers.length).fill(null);

    // Modbus columns (internal protocol)
    row[findCol('#')] = nextId;
    row[findCol('Active')] = 'True';
    row[findCol('Description')] = knxSignal.signalName;
    row[findCol('Data Length')] = dataLength;
    row[findCol('Format')] = format;
    row[findCol('Address')] = modbusAddress;
    row[findCol('Bit')] = '-';
    row[findCol('Read / Write')] = readWrite;
    row[findCol('String Length')] = '-';

    // KNX columns (external protocol - from ETS)
    const knxIdCol = headers.findIndex(
      (h, i) => h === '#' && i > findCol('String Length')
    );
    if (knxIdCol >= 0) row[knxIdCol] = nextId;
    row[findCol('DPT')] = dptFormatted;
    row[findCol('Group Address')] = knxSignal.groupAddress;
    row[findCol('Additional Addresses')] = '';
    row[findCol('U')] = flags.U ? 'U' : '';
    row[findCol('T')] = flags.T ? 'T' : '';
    row[findCol('Ri')] = flags.Ri ? 'Ri' : '';
    row[findCol('W')] = flags.W ? 'W' : '';
    row[findCol('R')] = flags.R ? 'R' : '';
    row[findCol('Priority')] = DEFAULT_KNX_PRIORITY;
    row[findCol('Conv. Id')] = '';
    row[findCol('Conversions')] = '-';

    signalsSheet.rows.push(row);
    rowsAdded++;
    nextId++;
    modbusAddress++;
  }

  return { updatedWorkbook: rawWorkbook, rowsAdded, warnings };
}
