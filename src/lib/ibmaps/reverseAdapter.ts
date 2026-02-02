import type { RawSignal } from './types';
import type { RawSheet, CellValue } from '../excel/raw';

/**
 * Column headers - must match adapter.ts COLUMN_HEADERS exactly
 */
const COLUMN_HEADERS = [
  '#', 'Active', 'Description', 'Name', 'Type', 'Instance', 'Units', 
  'NC', 'Texts', '# States', 'Rel. Def.', 'COV',
  '#', 'Device', '# Slave', 'Base', 'Read Func', 'Write Func', 
  'Data Length', 'Format', 'ByteOrder', 'Address', 'Bit', '# Bits', 
  'Deadband', 'Conv. Id', 'Conversions'
];

/**
 * Extract numeric type code from formatted type string
 * "0: AI" -> 0, "3: BI" -> 3
 */
function extractTypeCode(typeVal: CellValue): number {
  if (typeVal === null || typeVal === undefined) return 0;
  const str = String(typeVal);
  const match = str.match(/^(\d+):/);
  if (match) return parseInt(match[1], 10);
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Extract function code from formatted function string
 * "3: Read Holding Registers" -> 3, "-" -> -1
 */
function extractFunctionCode(funcVal: CellValue): number {
  if (funcVal === null || funcVal === undefined) return -1;
  const val = String(funcVal).trim();
  if (val === '-' || val === '') return -1;
  const match = val.match(/^(\d+):/);
  if (match) return parseInt(match[1], 10);
  const num = parseInt(val, 10);
  return isNaN(num) ? -1 : num;
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
 * Converts rows from a RawSheet back to RawSignal array.
 * Used when exporting new signals to ibmaps format.
 * 
 * @param sheet The Signals sheet from RawWorkbook
 * @param startIdx Start index of rows to convert (0-based from rows array)
 * @param count Number of rows to convert
 * @returns Array of RawSignal objects
 */
export function workbookRowsToRawSignals(
  sheet: RawSheet,
  startIdx: number,
  count: number,
): RawSignal[] {
  // Skip metadata rows (6) + header row (1) = 7 rows offset
  const dataStartIdx = startIdx + 7;
  const rows = sheet.rows.slice(dataStartIdx, dataStartIdx + count);

  return rows.map((row) => {
    const internalIdx = safeNumber(row[0], 0);
    const name = String(row[3] || '');
    const typeCode = extractTypeCode(row[4]);
    const instance = safeNumber(row[5], 0);
    const units = safeNumber(row[6], -1);

    const deviceName = String(row[13] || '');
    const slaveNum = safeNumber(row[14], 10);
    const readFunc = extractFunctionCode(row[16]);
    const writeFunc = extractFunctionCode(row[17]);
    const address = safeNumber(row[21], -1);

    // Extract device index from device name
    let deviceIndex = 0;
    const deviceMatch = deviceName.match(/Device\s+(\d+)/i);
    if (deviceMatch) deviceIndex = parseInt(deviceMatch[1], 10);

    return {
      idxExternal: internalIdx,
      name,
      direction: 'BACnet->Modbus',
      bacnet: {
        bacName: name,
        type: typeCode,
        instance,
        units,
        extraAttrs: {},
        map: {
          address,
          regType: -1,
          dataType: -1,
          readFunc,
          writeFunc,
          extraAttrs: {},
        },
      },
      modbus: {
        deviceIndex,
        slaveNum,
        address,
        readFunc,
        writeFunc,
        regType: -1,
        virtual: false,
        extraAttrs: {},
      },
    };
  });
}
