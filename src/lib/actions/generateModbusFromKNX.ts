import type { RawWorkbook, CellValue } from '../excel/raw';
import type { DeviceSignal } from '../deviceSignals';
import type {
  GenerateSignalsResult,
  ModbusGenerationPolicy,
} from '@/types/actions';
import { WARNINGS, EXCEL_VALUES } from '@/constants/generation';
import { findSignalsSheet, createSheetContext } from './utils/common';
import { filterKNXSignals } from './utils/signal-filtering';
import { formatDPT } from '../../constants/knxDPTs';
import { getDefaultKNXFlags, DEFAULT_KNX_PRIORITY } from './utils/knx';
import {
  knxDPTToModbusDataLength,
  knxDPTToModbusFormat,
} from './utils/mapping';

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
  policy: ModbusGenerationPolicy = {},
): GenerateSignalsResult {
  const warnings: string[] = [];
  let rowsAdded = 0;

  // Deep clone the workbook to ensure React detects changes
  const updatedWorkbook = JSON.parse(
    JSON.stringify(rawWorkbook),
  ) as RawWorkbook;

  // Filter only KNX signals
  const knxSignals = filterKNXSignals(deviceSignals);

  if (knxSignals.length === 0) {
    warnings.push(WARNINGS.NO_KNX_SIGNALS);
    return { updatedWorkbook, rowsAdded: 0, warnings };
  }

  // Find Signals sheet
  const signalsSheet = findSignalsSheet(updatedWorkbook);
  if (!signalsSheet) {
    warnings.push(WARNINGS.SIGNALS_SHEET_NOT_FOUND);
    return { updatedWorkbook, rowsAdded: 0, warnings };
  }

  // Create sheet context
  const { headers, findCol, getMaxNumericInColumn, headerRowIdx } =
    createSheetContext(signalsSheet);

  // Get the next # value (sequential ID)
  let nextId =
    signalsSheet.rows.length - (headerRowIdx >= 0 ? headerRowIdx : 0);

  // Modbus address counter (continue from last used address)
  const lastAddress = getMaxNumericInColumn('Address');
  let modbusAddress =
    policy.startAddress ?? (lastAddress >= 0 ? lastAddress + 1 : 0);

  // Helper to populate Modbus Internal columns
  const populateModbusColumns = (
    row: CellValue[],
    signalName: string,
    dataLength: string,
    format: string,
    address: number,
    readWrite: string,
    nextId: number,
  ): void => {
    row[findCol('#')] = nextId;
    row[findCol('Active')] = EXCEL_VALUES.ACTIVE_TRUE;
    row[findCol('Description')] = signalName;
    row[findCol('Data Length')] = dataLength;
    row[findCol('Format')] = format;
    row[findCol('Address')] = address;
    row[findCol('Bit')] = EXCEL_VALUES.EMPTY_KNX;
    row[findCol('Read / Write')] = readWrite;
    row[findCol('String Length')] = EXCEL_VALUES.EMPTY_KNX;
  };

  // Helper to populate KNX External columns
  const populateKNXColumns = (
    row: CellValue[],
    dptFormatted: string,
    groupAddress: string,
    flags: ReturnType<typeof getDefaultKNXFlags>,
    nextId: number,
  ): void => {
    // Find second # column (after String Length)
    const knxIdCol = headers.findIndex(
      (h, i) => h === '#' && i > findCol('String Length'),
    );
    if (knxIdCol >= 0) row[knxIdCol] = nextId;
    row[findCol('DPT')] = dptFormatted;
    row[findCol('Group Address')] = groupAddress;
    row[findCol('Additional Addresses')] = EXCEL_VALUES.EMPTY_KNX;
    row[findCol('U')] = flags.U ? 'U' : EXCEL_VALUES.EMPTY_KNX;
    row[findCol('T')] = flags.T ? 'T' : EXCEL_VALUES.EMPTY_KNX;
    row[findCol('Ri')] = flags.Ri ? 'Ri' : EXCEL_VALUES.EMPTY_KNX;
    row[findCol('W')] = flags.W ? 'W' : EXCEL_VALUES.EMPTY_KNX;
    row[findCol('R')] = flags.R ? 'R' : EXCEL_VALUES.EMPTY_KNX;
    row[findCol('Priority')] = DEFAULT_KNX_PRIORITY;
    row[findCol('Conv. Id')] = EXCEL_VALUES.EMPTY_KNX;
    row[findCol('Conversions')] = EXCEL_VALUES.EMPTY_KNX;
  };

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

    // Populate Modbus Internal columns
    populateModbusColumns(
      row,
      knxSignal.signalName,
      dataLength,
      format,
      modbusAddress,
      readWrite,
      nextId,
    );

    // Populate KNX External columns
    populateKNXColumns(
      row,
      dptFormatted,
      knxSignal.groupAddress,
      flags,
      nextId,
    );

    signalsSheet.rows.push(row);
    rowsAdded++;
    nextId++;
    modbusAddress++;
  }

  return { updatedWorkbook, rowsAdded, warnings };
}
