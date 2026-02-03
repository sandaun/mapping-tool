import type { RawSignal } from './types';
import type { RawSheet, CellValue } from '../excel/raw';

/**
 * Column headers - must match adapter.ts COLUMN_HEADERS exactly
 */
const COLUMN_HEADERS = [
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
 * "0: AI" -> 0, "3: BI" -> 3, "-" -> fallback
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

function extractLeadingCodeOptional(value: CellValue): number | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim();
  if (str === '' || str === '-') return undefined;
  const match = str.match(/^(\d+):/);
  if (match) return parseInt(match[1], 10);
  const num = parseInt(str, 10);
  return isNaN(num) ? undefined : num;
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
  const rows = sheet.rows.slice(startIdx, startIdx + count);

  const columnIndex = new Map(
    COLUMN_HEADERS.map((header, index) => [header, index]),
  );

  const col = (name: string): number => columnIndex.get(name) ?? -1;

  return rows.map((row) => {
    const internalIdx = safeNumber(row[col('#')], 0);
    const name = String(row[col('Name')] || '');
    const typeCode = extractLeadingCode(row[col('Type')], 0);
    const instance = safeNumber(row[col('Instance')], 0);
    const units = safeNumber(row[col('Units')], -1);

    const deviceName = String(row[col('Device')] || '');
    const slaveNum = safeNumber(row[col('# Slave')], 10);
    const readFunc = extractFunctionCode(row[col('Read Func')]);
    const writeFunc = extractFunctionCode(row[col('Write Func')]);
    const address = safeNumber(row[col('Address')], -1);
    const lenBits = safeOptionalNumber(row[col('Data Length')]);
    const format = extractLeadingCodeOptional(row[col('Format')]);
    const byteOrder = extractLeadingCodeOptional(row[col('ByteOrder')]);
    const bit = safeOptionalNumber(row[col('Bit')]);
    const numOfBits = safeOptionalNumber(row[col('# Bits')]);
    const deadband = safeOptionalNumber(row[col('Deadband')]);

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
