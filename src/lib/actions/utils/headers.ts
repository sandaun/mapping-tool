import type { CellValue } from '../../excel/raw';

/**
 * Finds the row index where the actual headers are located (looking for "#", "Active", etc.)
 */
export function findHeaderRowIndex(sheet: {
  headers: (string | null)[];
  rows: CellValue[][];
}): number {
  // Check if headers row already has characteristic columns
  if (sheet.headers.some((h) => h === '#' || h === 'Active' || h === 'Name')) {
    return -1; // Headers are at row -1 (means sheet.headers is the header row)
  }

  // Search in rows for the header row
  for (let i = 0; i < sheet.rows.length; i++) {
    const row = sheet.rows[i];
    if (
      row.some((cell) => cell === '#' || cell === 'Active' || cell === 'Name')
    ) {
      return i;
    }
  }

  return -1; // Not found
}
