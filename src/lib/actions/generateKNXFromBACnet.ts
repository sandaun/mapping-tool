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
import { findSignalsSheet, createSheetContext } from './utils/common';
import { filterBACnetSignals } from './utils/signal-filtering';
import { getBACnetReadWriteCapabilities } from './utils/read-write';
import { getLastDeviceNumberSimple } from './utils/device';
import { bacnetTypeToKNXDPT } from './utils/mapping';
import { formatBACnetType } from './utils/bacnet';
import {
  parseGroupAddress,
  formatGroupAddress,
  incrementGroupAddress,
  getDefaultKNXFlags,
  DEFAULT_KNX_PRIORITY,
  type GroupAddress,
} from './utils/knx';

/**
 * Generate KNX signals from BACnet device signals.
 * Gateway: KNX ← BACnet Client
 * Template: knx-to-bacnet-client.xlsx
 */
export function generateKNXFromBACnet(
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

  // Create sheet context
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

  // Detect last Device number to auto-increment
  const lastDeviceNum = getLastDeviceNumberSimple(signalsSheet);
  const newDeviceNum = lastDeviceNum + 1;

  // Filter BACnet signals
  const bacnetSignals = filterBACnetSignals(deviceSignals);

  // Helper to populate KNX Internal columns
  const populateKNXColumns = (
    row: CellValue[],
    signalName: string,
    dpt: string,
    groupAddr: GroupAddress,
    flags: ReturnType<typeof getDefaultKNXFlags>,
    nextId: number,
  ): void => {
    row[findCol('#')] = nextId;
    row[findCol('Active')] = EXCEL_VALUES.ACTIVE_TRUE;
    row[findCol('Description')] = signalName;
    row[findCol('DPT')] = dpt;
    row[findCol('Group Address')] = formatGroupAddress(groupAddr);
    row[findCol('Additional Addresses')] = EXCEL_VALUES.EMPTY_KNX;
    row[findCol('U')] = flags.U ? 'U' : EXCEL_VALUES.EMPTY_KNX;
    row[findCol('T')] = flags.T ? 'T' : EXCEL_VALUES.EMPTY_KNX;
    row[findCol('Ri')] = flags.Ri ? 'Ri' : EXCEL_VALUES.EMPTY_KNX;
    row[findCol('W')] = flags.W ? 'W' : EXCEL_VALUES.EMPTY_KNX;
    row[findCol('R')] = flags.R ? 'R' : EXCEL_VALUES.EMPTY_KNX;
    row[findCol('Priority')] = DEFAULT_KNX_PRIORITY;
  };

  // Helper to populate BACnet Client External columns
  const populateBACnetColumns = (
    row: CellValue[],
    objectType: string,
    instance: number,
    deviceName: string,
    nextId: number,
  ): void => {
    // Find second # column (after Priority)
    const bacnetIdCol = headers.findIndex(
      (h, i) => h === '#' && i > findCol('Priority'),
    );
    if (bacnetIdCol >= 0) row[bacnetIdCol] = nextId;
    row[findCol('Device Name')] = deviceName;
    row[findCol('Type')] = formatBACnetType(objectType);
    row[findCol('Instance')] = instance;
    row[findCol('Conv. Id')] = EXCEL_VALUES.EMPTY_KNX;
    row[findCol('Conversions')] = '-';
  };

  // Process each BACnet signal
  for (const bacnetSignal of bacnetSignals) {
    // Determine signal read/write capabilities based on BACnet object type
    const { isReadable, isWritable } = getBACnetReadWriteCapabilities(
      bacnetSignal.objectType,
    );

    // Map BACnet signal to KNX DPT
    const dpt = bacnetTypeToKNXDPT(bacnetSignal.objectType, bacnetSignal.units);

    // Generate KNX flags
    const flags = getDefaultKNXFlags(isReadable, isWritable);

    // Build row with all required columns
    const row: CellValue[] = new Array(headers.length).fill(null);

    // Populate KNX Internal columns
    populateKNXColumns(
      row,
      bacnetSignal.signalName,
      dpt,
      groupAddress,
      flags,
      nextId,
    );

    // Populate BACnet Client External columns
    const deviceName =
      policy.deviceName ?? DEVICE_TEMPLATES.DEVICE(newDeviceNum);
    populateBACnetColumns(
      row,
      bacnetSignal.objectType,
      bacnetSignal.instance,
      deviceName,
      nextId,
    );

    signalsSheet.rows.push(row);
    rowsAdded++;
    nextId++;

    // Increment Group Address for next signal
    try {
      groupAddress = incrementGroupAddress(groupAddress);
    } catch {
      warnings.push(
        `Group address overflow at signal ${bacnetSignal.signalName}. Stopping generation.`,
      );
      break;
    }
  }

  return { updatedWorkbook, rowsAdded, warnings };
}
