import * as XLSX from 'xlsx';

export type CellValue = string | number | boolean | null;

export type RawSheet = {
  name: string;
  headers: (string | null)[];
  rows: CellValue[][];
};

export type RawWorkbook = {
  sheets: RawSheet[];
};

export class ExcelContractError extends Error {
  readonly missingSheets: string[];

  constructor(message: string, missingSheets: string[]) {
    super(message);
    this.name = 'ExcelContractError';
    this.missingSheets = missingSheets;
  }
}

function toHeaderString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function normalizeRow(row: unknown[], width: number): CellValue[] {
  const normalized: CellValue[] = new Array(width).fill(null);
  for (let i = 0; i < Math.min(width, row.length); i++) {
    const value = row[i];
    if (value === undefined) {
      normalized[i] = null;
    } else if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      normalized[i] = value;
    } else {
      normalized[i] = String(value);
    }
  }
  return normalized;
}

function worksheetToAOA(ws: XLSX.WorkSheet): unknown[][] {
  // header: 1 => array-of-arrays
  return XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  }) as unknown[][];
}

function aoaToRawSheet(name: string, aoa: unknown[][]): RawSheet {
  const headerRow = aoa[0] ?? [];
  const dataRows = aoa.slice(1);

  const maxCols = Math.max(
    headerRow.length,
    0,
    ...dataRows.map((r) => (Array.isArray(r) ? r.length : 0))
  );

  const headers = normalizeRow(headerRow, maxCols).map(toHeaderString);
  const rows = dataRows.map((r) =>
    normalizeRow(Array.isArray(r) ? r : [], maxCols)
  );

  return { name, headers, rows };
}

export function workbookArrayBufferToRaw(
  arrayBuffer: ArrayBuffer,
  expectedSheets?: string[]
): RawWorkbook {
  const uint8 = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(uint8, {
    type: 'array',
    // Ensures blank cells can be represented during parsing utilities.
    sheetStubs: true,
  });

  const sheets: RawSheet[] = workbook.SheetNames.map((name) => {
    const ws = workbook.Sheets[name];
    const aoa = ws ? worksheetToAOA(ws) : [];
    return aoaToRawSheet(name, aoa);
  });

  // Validació dinàmica: si es passen expectedSheets, valida'ls; si no, només 'Signals'
  const sheetsToValidate = expectedSheets ?? ['Signals'];
  const present = new Set(workbook.SheetNames);
  const missing = sheetsToValidate.filter((s) => !present.has(s));
  if (missing.length > 0) {
    throw new ExcelContractError(
      `Falten sheets esperats: ${missing.join(', ')}`,
      missing
    );
  }

  return { sheets };
}

export function rawToXlsxBuffer(raw: RawWorkbook, includeHeaders: boolean = true): Buffer {
  const workbook = XLSX.utils.book_new();

  for (const sheet of raw.sheets) {
    const aoa: unknown[][] = includeHeaders
      ? [sheet.headers.map((h) => (h === null ? null : h)), ...sheet.rows]
      : [...sheet.rows];

    const ws = XLSX.utils.aoa_to_sheet(aoa, { sheetStubs: true });
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  }

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
}

export type ProtocolsMetadata = {
  internalProtocol: string | null;
  externalProtocol: string | null;
};

export function readProtocolsMetadataFromWorkbook(
  workbook: XLSX.WorkBook
): ProtocolsMetadata {
  const sheet = workbook.Sheets['Signals'];
  if (!sheet) {
    return { internalProtocol: null, externalProtocol: null };
  }

  const b4 = sheet['B4'];
  const b5 = sheet['B5'];

  const internalProtocol =
    b4?.v != null && String(b4.v).trim() !== '' ? String(b4.v).trim() : null;

  const externalProtocol =
    b5?.v != null && String(b5.v).trim() !== '' ? String(b5.v).trim() : null;

  return { internalProtocol, externalProtocol };
}
