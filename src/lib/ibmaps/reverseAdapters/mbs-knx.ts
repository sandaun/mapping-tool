import type { MBSKNXRawSignal } from '../types';
import type { RawSheet, CellValue } from '../../excel/raw';

/**
 * Column headers - must match adapters/mbs-knx.ts COLUMN_HEADERS exactly
 * Order: #, Active, Description, Data Length, Format, Address, Bit, Read / Write, String Length, ...
 */
const COLUMN_HEADERS = [
  // Internal (Modbus Slave)
  '#',
  'Active',
  'Description',
  'Data Length',
  'Format',
  'Address',
  'Bit',
  'Read / Write',
  'String Length',
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

/**
 * Extract numeric code from formatted values
 * "3: Low" -> 3, "16: 1 Register (16 bits)" -> 16, "-" -> fallback
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
 * Parse boolean from display value
 * "True" -> true, "False" or empty -> false
 */
function parseBoolean(val: CellValue): boolean {
  if (val === null || val === undefined) return false;
  return String(val).toLowerCase() === 'true';
}

/**
 * Converts rows from a RawSheet (MBS-KNX template) back to MBSKNXRawSignal array.
 * Used when exporting new signals to ibmaps format.
 *
 * @param sheet The Signals sheet from RawWorkbook
 * @param startIdx Start index of rows to convert (0-based from rows array)
 * @param count Number of rows to convert
 * @returns Array of MBSKNXRawSignal objects
 */
export function workbookRowsToMBSKNXSignals(
  sheet: RawSheet,
  startIdx: number,
  count: number,
): MBSKNXRawSignal[] {
  const rows = sheet.rows.slice(startIdx, startIdx + count);

  const columnIndex = new Map(
    COLUMN_HEADERS.map((header, index) => [header, index]),
  );

  const col = (name: string): number => columnIndex.get(name) ?? -1;

  // Use first occurrence of '#' (index 0) for internalIdx, not the second one (index 9)
  const firstHashIdx = COLUMN_HEADERS.indexOf('#');

  return rows.map((row) => {
    const internalIdx = safeNumber(row[firstHashIdx], 0);
    const description = String(row[col('Description')] || '');
    
    // Modbus Slave fields
    const dataLength = extractLeadingCode(row[col('Data Length')], 16);
    const format = extractLeadingCode(row[col('Format')], 0);
    const address = safeNumber(row[col('Address')], 0);
    const bit = safeNumber(row[col('Bit')], -1);
    const readWrite = extractLeadingCode(row[col('Read / Write')], 2);
    const stringLength = safeNumber(row[col('String Length')], -1);
    const isEnabled = parseBoolean(row[col('Active')]);

    // KNX fields
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

    return {
      idxExternal: internalIdx,
      name: description,
      direction: 'Modbus Slave->KNX',
      modbusSlave: {
        description,
        dataLength,
        format,
        address,
        bit,
        readWrite,
        stringLength,
        isEnabled,
        virtual: false,
        extraAttrs: {},
      },
      knx: {
        description,
        active: true,
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
