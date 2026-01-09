import type { CellValue } from '../../excel/raw';
import { findHeaderRowIndex } from './headers';

/**
 * Get the last device number from 'Device X' format (Modbus Slave template).
 */
export function getLastDeviceNumberSimple(sheet: {
  headers: (string | null)[];
  rows: CellValue[][];
}): number {
  const headerRowIdx = findHeaderRowIndex(sheet);
  const headers = headerRowIdx >= 0 ? sheet.rows[headerRowIdx] : sheet.headers;

  const deviceNameCol = headers.findIndex((h) => h === 'Device Name');
  if (deviceNameCol < 0) return -1;

  let maxNum = -1;
  for (const row of sheet.rows) {
    const deviceName = row[deviceNameCol];
    if (typeof deviceName === 'string') {
      // Match 'Device X' format
      const match = deviceName.match(/Device\s+(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  return maxNum;
}

/**
 * Detect the highest device number already in the Signals sheet
 */
export function getLastDeviceNumber(sheet: {
  headers: (string | null)[];
  rows: CellValue[][];
}): number {
  const headerRowIdx = findHeaderRowIndex(sheet);
  const headers = headerRowIdx >= 0 ? sheet.rows[headerRowIdx] : sheet.headers;
  const deviceColIdx = headers.findIndex((h) => h === 'Device');

  if (deviceColIdx < 0) return -1;

  let maxDevice = -1;
  const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

  for (let i = startRow; i < sheet.rows.length; i++) {
    const deviceValue = sheet.rows[i][deviceColIdx];
    if (typeof deviceValue === 'string') {
      // Parse "RTU // Port A // Device 0" → extract 0
      const match = deviceValue.match(/Device (\d+)/);
      if (match) {
        const deviceNum = parseInt(match[1], 10);
        if (deviceNum > maxDevice) maxDevice = deviceNum;
      }
    }
  }

  return maxDevice;
}
