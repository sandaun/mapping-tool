import type { RawWorkbook, CellValue } from '../excel/raw';
import type { DeviceSignal } from '../deviceSignals';
import type { GenerateSignalsResult, AllocationPolicy } from '@/types/actions';
import { WARNINGS, EXCEL_VALUES } from '@/constants/generation';
import { findSignalsSheet, createSheetContext } from './utils/common';
import { filterKNXSignals } from './utils/signal-filtering';
import { formatDPT } from '../../constants/knxDPTs';
import { getDefaultKNXFlags, DEFAULT_KNX_PRIORITY } from './utils/knx';
import { knxDPTToBACnetType, getBACnetFieldsByType } from './utils/mapping';
import { formatBACnetType } from './utils/bacnet';

/**
 * Generate BACnet Server signals from KNX signals (imported from ETS CSV).
 * Gateway: BACnet Server ← KNX
 *
 * Template structure (24 columns):
 * - BACnet Server (internal): #, Active, Description, Name, Type, Instance, Units, NC, Texts, # States, Rel. Def., COV
 * - KNX (external): #, DPT, Group Address, Additional Addresses, U, T, Ri, W, R, Priority, Conv. Id, Conversions
 */
export function generateBACnetServerFromKNX(
  deviceSignals: DeviceSignal[],
  rawWorkbook: RawWorkbook,
  policy: AllocationPolicy = {}
): GenerateSignalsResult {
  const warnings: string[] = [];
  let rowsAdded = 0;

  // Filter only KNX signals
  const knxSignals = filterKNXSignals(deviceSignals);

  if (knxSignals.length === 0) {
    warnings.push(WARNINGS.NO_KNX_SIGNALS);
    return { updatedWorkbook: rawWorkbook, rowsAdded: 0, warnings };
  }

  // Find Signals sheet
  const signalsSheet = findSignalsSheet(rawWorkbook);
  if (!signalsSheet) {
    warnings.push(WARNINGS.SIGNALS_SHEET_NOT_FOUND);
    return { updatedWorkbook: rawWorkbook, rowsAdded: 0, warnings };
  }

  // Create sheet context
  const { headers, findCol, getMaxNumericInColumn, headerRowIdx } = createSheetContext(signalsSheet);

  // Get the next # value (sequential ID)
  let nextId =
    signalsSheet.rows.length - (headerRowIdx >= 0 ? headerRowIdx : 0);

  // BACnet instance counter (continue from last used instance)
  const lastInstance = getMaxNumericInColumn('Instance');
  let bacnetInstance =
    policy.startInstance ?? (lastInstance >= 0 ? lastInstance + 1 : 0);

  // Helper to populate BACnet Server Internal columns
  const populateBACnetColumns = (
    row: CellValue[],
    signalName: string,
    description: string | undefined,
    objectType: string,
    instance: number,
    bacnetFields: ReturnType<typeof getBACnetFieldsByType>,
    nextId: number
  ): void => {
    row[findCol('#')] = nextId;
    row[findCol('Active')] = EXCEL_VALUES.ACTIVE_TRUE;
    row[findCol('Description')] = description || EXCEL_VALUES.EMPTY_KNX;
    row[findCol('Name')] = signalName;
    row[findCol('Type')] = formatBACnetType(objectType);
    row[findCol('Instance')] = instance;
    row[findCol('Units')] = bacnetFields.units;
    row[findCol('NC')] = EXCEL_VALUES.EMPTY_BACNET;
    row[findCol('Texts')] = EXCEL_VALUES.EMPTY_BACNET;
    row[findCol('# States')] = bacnetFields.states;
    row[findCol('Rel. Def.')] = bacnetFields.relDef;
    row[findCol('COV')] = bacnetFields.cov;
  };

  // Helper to populate KNX External columns
  const populateKNXColumns = (
    row: CellValue[],
    dptFormatted: string,
    groupAddress: string,
    flags: ReturnType<typeof getDefaultKNXFlags>,
    nextId: number
  ): void => {
    // Find second # column (after COV)
    const knxIdCol = headers.findIndex(
      (h, i) => h === '#' && i > findCol('COV')
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

    // Determine BACnet columns from DPT
    const objectType = knxDPTToBACnetType(knxSignal.dpt);

    // Get proper BACnet field values (Units, #States, Rel. Def., COV)
    const bacnetFields = getBACnetFieldsByType(objectType, knxSignal.dpt);

    // Determine KNX flags based on signal name semantics
    // If name contains "Status", "Feedback", "Read" → només R (read)
    // If name contains "Write", "Command", "Set" → només W (write)
    // Otherwise → R + W (read/write)
    const nameLower = knxSignal.signalName.toLowerCase();
    let isReadable = true;
    let isWritable = true;
    if (
      nameLower.includes('status') ||
      nameLower.includes('feedback') ||
      nameLower.includes('read')
    ) {
      isWritable = false;
    } else if (
      nameLower.includes('write') ||
      nameLower.includes('command') ||
      nameLower.includes('set')
    ) {
      isReadable = false;
    }

    const flags = getDefaultKNXFlags(isReadable, isWritable);

    // Build row with 24 columns
    const row: CellValue[] = new Array(headers.length).fill(null);

    // Populate BACnet Server Internal columns
    populateBACnetColumns(row, knxSignal.signalName, knxSignal.description, objectType, bacnetInstance, bacnetFields, nextId);

    // Populate KNX External columns
    populateKNXColumns(row, dptFormatted, knxSignal.groupAddress, flags, nextId);

    signalsSheet.rows.push(row);
    rowsAdded++;
    nextId++;
    bacnetInstance++;
  }

  return { updatedWorkbook: rawWorkbook, rowsAdded, warnings };
}
