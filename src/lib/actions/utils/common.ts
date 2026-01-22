import type { RawWorkbook, RawSheet, CellValue } from '@/lib/excel/raw';
import { WARNINGS } from '@/constants/generation';
import { findHeaderRowIndex } from './headers';

/**
 * Context object to facilitate sheet operations
 * Provides helpers for column lookup, numeric column max, etc.
 */
export type SheetContext = {
  sheet: RawSheet;
  headers: CellValue[];
  headerRowIdx: number;
  findCol: (name: string) => number;
  getMaxNumericInColumn: (colName: string) => number;
  getNextId: () => number;
  createEmptyRow: () => CellValue[];
};

/**
 * Find the Signals sheet in a workbook
 */
export function findSignalsSheet(workbook: RawWorkbook): RawSheet | null {
  return workbook.sheets.find((s) => s.name === 'Signals') ?? null;
}

/**
 * Create a sheet context with helper methods
 * Eliminates repetitive code across all actions
 */
export function createSheetContext(sheet: RawSheet): SheetContext {
  const headerRowIdx = findHeaderRowIndex(sheet);
  const headers = headerRowIdx >= 0 ? sheet.rows[headerRowIdx] : sheet.headers;

  const findCol = (name: string): number => {
    return headers.findIndex((h) => h === name);
  };

  const getMaxNumericInColumn = (colName: string): number => {
    const colIdx = findCol(colName);
    if (colIdx < 0) return -1;

    let max = -1;
    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
    for (let i = startRow; i < sheet.rows.length; i++) {
      const cell = sheet.rows[i][colIdx];
      const value =
        typeof cell === 'number'
          ? cell
          : typeof cell === 'string'
          ? Number(cell)
          : NaN;
      if (!Number.isNaN(value)) {
        max = Math.max(max, value);
      }
    }
    return max;
  };

  const getNextId = (): number => {
    return sheet.rows.length - (headerRowIdx >= 0 ? headerRowIdx : 0);
  };

  const createEmptyRow = (): CellValue[] => {
    return new Array(headers.length).fill(null);
  };

  return {
    sheet,
    headers,
    headerRowIdx,
    findCol,
    getMaxNumericInColumn,
    getNextId,
    createEmptyRow,
  };
}

/**
 * Find the second # column (used for external protocol columns)
 */
export function findSecondHashColumn(
  headers: CellValue[],
  afterColumnName: string
): number {
  const afterColIdx = headers.findIndex((h) => h === afterColumnName);
  return headers.findIndex((h, i) => h === '#' && i > afterColIdx);
}

/**
 * Helper to generate sheet not found warning
 */
export function createSheetNotFoundWarning(): string {
  return WARNINGS.SIGNALS_SHEET_NOT_FOUND;
}
