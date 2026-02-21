import type { BACKNXRawSignal } from '../types';
import type { RawSheet, CellValue } from '../../excel/raw';

/**
 * Column headers - must match adapters/bac-knx.ts COLUMN_HEADERS exactly
 * Order: #, Active, Description, Name, Type, Instance, Units, NC, Texts, # States, Rel. Def., COV,
 *        #, DPT, Group Address, Additional Addresses, U, T, Ri, W, R, Priority,
 *        Conv. Id, Conversions
 */
const COLUMN_HEADERS = [
  // Internal (BACnet Server)
  '#',
  'Active',
  'Description',
  'Name',
  'Type',
  'Instance',
  'Units',
  'NC',
  'Texts',
  '# States',
  'Rel. Def.',
  'COV',
  // External (KNX)
  '#',
  'DPT',
  'Group Address',
  'Additional Addresses',
  'U',
  'T',
  'Ri',
  'W',
  'R',
  'Priority',
  // Extra
  'Conv. Id',
  'Conversions',
];

// Reverse mapping of BACnet type names to codes
const BAC_TYPE_CODES: Record<string, number> = {
  'AI': 0,
  'AO': 1,
  'AV': 2,
  'BI': 3,
  'BO': 4,
  'BV': 5,
  'MI': 13,
  'MO': 14,
  'MV': 19,
};

// BACnet object type to ObjectID base multiplier
const BAC_TYPE_OBJECT_ID_BASE: Record<number, number> = {
  0: 0, // AI
  1: 4194304, // AO
  2: 8388608, // AV
  3: 12582912, // BI
  4: 16777216, // BO
  5: 20971520, // BV
  13: 54525952, // MI
  14: 58720256, // MO
  19: 79691776, // MV
};

/**
 * Extract numeric code from formatted values
 * "3: Low" -> 3, "5: BV" -> 5, "-" -> fallback
 */
function extractLeadingCode(value: CellValue, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  if (str === '' || str === '-') return fallback;
  const match = str.match(/^(\d+):/);
  if (match) return parseInt(match[1], 10);
  const num = parseInt(str, 10);
  return isNaN(num) ? fallback : num;
}

/**
 * Extract BACnet type from formatted string
 * "5: BV" -> 5, "BV" -> 5
 */
function extractBacType(value: CellValue): number {
  if (value === null || value === undefined) return 2; // Default to AV
  const str = String(value).trim();
  if (str === '' || str === '-') return 2;

  // Try "number: name" format first
  const match = str.match(/^(\d+):/);
  if (match) return parseInt(match[1], 10);

  // Try just a number
  const num = parseInt(str, 10);
  if (!isNaN(num)) return num;

  // Try name lookup
  const upperStr = str.toUpperCase();
  for (const [name, code] of Object.entries(BAC_TYPE_CODES)) {
    if (upperStr.includes(name)) return code;
  }

  return 2; // Default to AV
}

/**
 * Extract DPT value from formatted string
 * "9.001: temperature (°C)" -> 2305 (9*256+1)
 * "1.001: switch" -> 257 (1*256+1)
 * "3.x: (4-bit. 3-bit controlled)" -> 775 (3*256+7) - default for family 3
 * "2.x: (2-bit. 1 bit controlled)" -> 513 (2*256+1) - default for family 2
 */
function extractDPTValue(value: CellValue): number {
  if (value === null || value === undefined) return 257; // Default to 1.001: switch
  const str = String(value).trim();
  if (str === '' || str === '-') return 257;

  // Match pattern "main.sub" at start (e.g., "9.001")
  const match = str.match(/^(\d+)\.(\d+)/);
  if (match) {
    const main = parseInt(match[1], 10);
    const sub = parseInt(match[2], 10);
    return main * 256 + sub;
  }

  // Handle fallback "main.x" patterns (e.g., "3.x:", "2.x:")
  const fallbackMatch = str.match(/^(\d+)\.x/);
  if (fallbackMatch) {
    const main = parseInt(fallbackMatch[1], 10);
    // Use common defaults for each family
    if (main === 3) return 3 * 256 + 7;  // 3.007: dimming control
    if (main === 2) return 2 * 256 + 1;  // 2.001: switch control
    return main * 256 + 1; // Default to .001 for unknown families
  }

  // If it's just a number, return it
  const num = parseInt(str, 10);
  return isNaN(num) ? 257 : num;
}

/**
 * Parse Group Address string to numeric value
 * "0/0/1" -> 1, "1/2/3" -> 2563
 */
function parseGroupAddressValue(groupAddress: string): number {
  const parts = groupAddress.split('/').map((p) => parseInt(p.trim(), 10));
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [main, middle, sub] = parts;
  return (main << 11) | (middle << 8) | sub;
}

/**
 * Safe number extraction
 */
function safeNumber(val: CellValue, fallback: number = -1): number {
  if (val === null || val === undefined || val === '-') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

/**
 * Parse flag from display value
 * "U", "T", "Ri", "W", "R" -> true, " " or empty -> false
 */
function parseFlag(val: CellValue): boolean {
  if (val === null || val === undefined) return false;
  return String(val).trim().length > 0;
}

/**
 * Calculate ObjectID from BACType and Instance
 */
function calculateObjectId(type: number, instance: number): number {
  const base = BAC_TYPE_OBJECT_ID_BASE[type] ?? 0;
  return base + instance;
}

/**
 * Converts rows from a RawSheet (BAC-KNX template) back to BACKNXRawSignal array.
 * Used when exporting new signals to ibmaps format.
 *
 * @param sheet The Signals sheet from RawWorkbook
 * @param startIdx Start index of rows to convert (0-based from rows array)
 * @param count Number of rows to convert
 * @returns Array of BACKNXRawSignal objects
 */
export function workbookRowsToBACKNXSignals(
  sheet: RawSheet,
  startIdx: number,
  count: number,
): BACKNXRawSignal[] {
  const rows = sheet.rows.slice(startIdx, startIdx + count);

  const columnIndex = new Map(
    COLUMN_HEADERS.map((header, index) => [header, index]),
  );

  const col = (name: string): number => columnIndex.get(name) ?? -1;

  return rows.map((row) => {
    // Internal (BACnet)
    const internalIdx = safeNumber(row[col('#')], 0);
    const description = String(row[col('Description')] || '');
    const bacName = String(row[col('Name')] || '');
    const bacType = extractBacType(row[col('Type')]);
    const instance = safeNumber(row[col('Instance')], 0);
    const units = extractLeadingCode(row[col('Units')], -1);
    const numOfStates = safeNumber(row[col('# States')], -1);
    const relinquish = safeNumber(row[col('Rel. Def.')], -1);
    const cov = safeNumber(row[col('COV')], -1);
    const active = String(row[col('Active')]).toLowerCase() === 'true';

    // External (KNX)
    const dptValue = extractDPTValue(row[col('DPT')]);
    const groupAddress = String(row[col('Group Address')] || '0/0/0');
    const groupAddressValue = parseGroupAddressValue(groupAddress);
    const additionalAddresses = String(row[col('Additional Addresses')] || '');
    const priority = extractLeadingCode(row[col('Priority')], 3);

    // Parse flags
    const u = parseFlag(row[col('U')]);
    const t = parseFlag(row[col('T')]);
    const ri = parseFlag(row[col('Ri')]);
    const w = parseFlag(row[col('W')]);
    const r = parseFlag(row[col('R')]);

    const objectId = calculateObjectId(bacType, instance);

    return {
      idxExternal: internalIdx,
      name: bacName,
      direction: 'BACnet->KNX',
      bacnet: {
        bacName,
        description,
        type: bacType,
        instance,
        objectId,
        units: units >= 0 ? units : undefined,
        cov: cov >= 0 ? cov : undefined,
        relinquish: relinquish >= 0 ? relinquish : undefined,
        numOfStates: numOfStates >= 0 ? numOfStates : undefined,
        active,
        polarity: false,
        virtual: false,
        extraAttrs: {},
      },
      knx: {
        description: description || bacName,
        active,
        dptValue,
        groupAddress,
        groupAddressValue,
        additionalAddresses: additionalAddresses || undefined,
        flags: { u, t, ri, w, r },
        priority,
        virtual: false,
        extraAttrs: {},
      },
    };
  });
}
