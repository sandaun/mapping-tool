import type { KNXRawSignal } from '../types';
import type { RawSheet, CellValue } from '../../excel/raw';

/**
 * Column headers - must match adapters/knx-mbm.ts COLUMN_HEADERS exactly
 */
const COLUMN_HEADERS = [
  '#',
  'Active',
  'Description',
  'DPT',
  'Group Address',
  'Additional Addresses',
  'U',
  'T',
  'Ri',
  'W',
  'R',
  'Priority',
  '#',
  'Device',
  '# Slave',
  'Base',
  'Read Func',
  'Write Func',
  'Data Length',
  'Format',
  'ByteOrder',
  'Address',
  'Bit',
  '# Bits',
  'Deadband',
  'Conv. Id',
  'Conversions',
];

/**
 * Extract numeric code from formatted values
 * "3: Low" -> 3, "9.001: temperature (°C)" -> 2305 (9*256+1), "-" -> fallback
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
 * Extract function code from formatted function string
 * "3: Read Holding Registers" -> 3, "-" -> -1
 */
function extractFunctionCode(funcVal: CellValue): number {
  return extractLeadingCode(funcVal, -1);
}

/**
 * Safe number extraction
 */
function safeNumber(val: CellValue, fallback: number = -1): number {
  if (val === null || val === undefined || val === '-') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function safeOptionalNumber(val: CellValue): number | undefined {
  if (val === null || val === undefined || val === '-') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
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
 * Converts rows from a RawSheet (KNX-MBM template) back to KNXRawSignal array.
 * Used when exporting new signals to ibmaps format.
 *
 * @param sheet The Signals sheet from RawWorkbook
 * @param startIdx Start index of rows to convert (0-based from rows array)
 * @param count Number of rows to convert
 * @returns Array of KNXRawSignal objects
 */
export function workbookRowsToKnxRawSignals(
  sheet: RawSheet,
  startIdx: number,
  count: number,
): KNXRawSignal[] {
  const rows = sheet.rows.slice(startIdx, startIdx + count);

  const columnIndex = new Map(
    COLUMN_HEADERS.map((header, index) => [header, index]),
  );

  const col = (name: string): number => columnIndex.get(name) ?? -1;

  return rows.map((row) => {
    const internalIdx = safeNumber(row[col('#')], 0);
    const description = String(row[col('Description')] || '');
    const dptValue = extractDPTValue(row[col('DPT')]);
    const groupAddress = String(row[col('Group Address')] || '0/0/0');
    const groupAddressValue = parseGroupAddressValue(groupAddress);
    const additionalAddresses = String(row[col('Additional Addresses')] || '');
    const active = String(row[col('Active')]).toLowerCase() === 'true';
    const priority = extractLeadingCode(row[col('Priority')], 3);

    // Parse flags
    const u = parseFlag(row[col('U')]);
    const t = parseFlag(row[col('T')]);
    const ri = parseFlag(row[col('Ri')]);
    const w = parseFlag(row[col('W')]);
    const r = parseFlag(row[col('R')]);

    // Modbus side
    const deviceName = String(row[col('Device')] || '');
    const slaveNum = safeNumber(row[col('# Slave')], 10);
    const readFunc = extractFunctionCode(row[col('Read Func')]);
    const writeFunc = extractFunctionCode(row[col('Write Func')]);
    const address = safeNumber(row[col('Address')], -1);
    const lenBits = safeOptionalNumber(row[col('Data Length')]);
    const format = extractLeadingCode(row[col('Format')], 99);
    const byteOrder = extractLeadingCode(row[col('ByteOrder')], 255);
    const bit = safeOptionalNumber(row[col('Bit')]);
    const numOfBits = safeOptionalNumber(row[col('# Bits')]);
    const deadband = safeOptionalNumber(row[col('Deadband')]);

    // Extract device index from device name
    let deviceIndex = 0;
    const deviceMatch = deviceName.match(/Device\s+(\d+)/i);
    if (deviceMatch) deviceIndex = parseInt(deviceMatch[1], 10);

    return {
      idxExternal: internalIdx,
      name: description,
      direction: 'KNX->Modbus',
      knx: {
        description,
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
      modbus: {
        deviceIndex,
        slaveNum,
        address,
        readFunc,
        writeFunc,
        lenBits,
        format,
        byteOrder,
        bit,
        numOfBits,
        deadband,
        virtual: false,
        extraAttrs: {},
      },
    };
  });
}
