import type { RawWorkbook, CellValue } from '../excel/raw';
import type { DeviceSignal, BACnetSignal } from '../deviceSignals';
import { findHeaderRowIndex } from './utils/headers';
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

export type GenerateSignalsResult = {
  updatedWorkbook: RawWorkbook;
  rowsAdded: number;
  warnings: string[];
};

export interface KNXGenerationPolicy {
  startGroupAddress?: string; // Default: "0/0/1"
  deviceName?: string; // Default: "Device 0"
}

/**
 * Generate KNX signals from BACnet device signals.
 * Gateway: KNX ← BACnet Client
 * Template: knx-to-bacnet-client.xlsx
 */
export function generateKNXFromBACnet(
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
        `Invalid startGroupAddress: ${policy.startGroupAddress}. Using next available address.`
      );
      groupAddress = getNextGroupAddressFromSheet();
    }
  } else {
    groupAddress = getNextGroupAddressFromSheet();
  }

  // Detect last Device number to auto-increment
  const lastDeviceNum = getLastDeviceNumberSimple(signalsSheet);
  const newDeviceNum = lastDeviceNum + 1;

  // Process each BACnet signal
  for (const sig of deviceSignals) {
    if (!('objectType' in sig)) continue; // Skip non-BACnet signals

    const bacnetSignal = sig as BACnetSignal;

    // Determine signal read/write capabilities based on BACnet object type
    // INPUT (AI, BI, MI): només READ
    // OUTPUT (AO, BO, MO): només WRITE
    // VALUE (AV, BV, MV): READ + WRITE
    const isInput = bacnetSignal.objectType.endsWith('I');
    const isOutput = bacnetSignal.objectType.endsWith('O');
    const isValue = bacnetSignal.objectType.endsWith('V');
    const isReadable = isInput || isValue;
    const isWritable = isOutput || isValue;

    // Map BACnet signal to KNX DPT
    const dpt = bacnetTypeToKNXDPT(bacnetSignal.objectType, bacnetSignal.units);

    // Generate KNX flags
    const flags = getDefaultKNXFlags(isReadable, isWritable);

    // Build row with all required columns
    const row: CellValue[] = new Array(headers.length).fill(null);

    // KNX Internal columns
    row[findCol('#')] = nextId;
    row[findCol('Active')] = 'True';
    row[findCol('Description')] = bacnetSignal.signalName;
    row[findCol('DPT')] = dpt;
    row[findCol('Group Address')] = formatGroupAddress(groupAddress);
    row[findCol('Additional Addresses')] = '';
    row[findCol('U')] = flags.U ? 'U' : '';
    row[findCol('T')] = flags.T ? 'T' : '';
    row[findCol('Ri')] = flags.Ri ? 'Ri' : '';
    row[findCol('W')] = flags.W ? 'W' : '';
    row[findCol('R')] = flags.R ? 'R' : '';
    row[findCol('Priority')] = DEFAULT_KNX_PRIORITY;

    // BACnet Client External columns (second #)
    const bacnetIdCol = headers.findIndex(
      (h, i) => h === '#' && i > findCol('Priority')
    );
    if (bacnetIdCol >= 0) row[bacnetIdCol] = nextId;
    row[findCol('Device Name')] = policy.deviceName ?? `Device ${newDeviceNum}`;
    row[findCol('Type')] = formatBACnetType(bacnetSignal.objectType);
    row[findCol('Instance')] = bacnetSignal.instance;
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
        `Group address overflow at signal ${bacnetSignal.signalName}. Stopping generation.`
      );
      break;
    }
  }

  return { updatedWorkbook: rawWorkbook, rowsAdded, warnings };
}
