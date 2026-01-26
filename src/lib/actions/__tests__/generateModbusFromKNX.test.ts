import { describe, it, expect } from 'vitest';
import { generateModbusFromKNX } from '../generateModbusFromKNX';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { KNXSignal } from '@/lib/deviceSignals';

// Import fixtures
import inputSignals from './fixtures/modbus-from-knx/input-signals.json';
import inputWorkbook from './fixtures/modbus-from-knx/input-workbook.json';

describe('generateModbusFromKNX', () => {
  describe('amb fixtures reals', () => {
    it('genera el nombre correcte de rows amb totes les 58 signals', () => {
      const result = generateModbusFromKNX(
        inputSignals as KNXSignal[],
        inputWorkbook as RawWorkbook
      );

      expect(result.rowsAdded).toBe(58);
      expect(result.warnings).toHaveLength(0);
      
      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals');
      expect(signalsSheet).toBeDefined();
      
      // Headers at row 5 (index 5), so data starts at row 6
      const dataRows = signalsSheet!.rows.slice(6);
      expect(dataRows).toHaveLength(58);
    });

    it('genera rows amb valors no nuls per totes les signals', () => {
      const result = generateModbusFromKNX(
        inputSignals as KNXSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const dataRows = signalsSheet.rows.slice(6);

      // Totes les rows haurien de tenir algun valor no nul
      dataRows.forEach((row, idx) => {
        const hasValues = row.some(cell => cell !== null && cell !== undefined && cell !== '');
        expect(hasValues, `Row ${idx} hauria de tenir valors`).toBe(true);
      });
    });

    it('assigna Modbus Address numèric per totes les signals', () => {
      const result = generateModbusFromKNX(
        inputSignals as KNXSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const addressColIndex = headers.findIndex(h => h === 'Address');

      const dataRows = signalsSheet.rows.slice(6);
      
      // Totes les rows haurien de tenir Address numèric vàlid
      dataRows.forEach((row, idx) => {
        const addressValue = row[addressColIndex];
        expect(typeof addressValue, `Row ${idx} hauria de tenir Address numèric`).toBe('number');
        expect(addressValue, `Row ${idx} Address hauria de ser >= 0`).toBeGreaterThanOrEqual(0);
      });
    });

    it('genera Active = True per totes les signals', () => {
      const result = generateModbusFromKNX(
        inputSignals as KNXSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const activeColIndex = headers.findIndex(h => h === 'Active');

      const dataRows = signalsSheet.rows.slice(6);
      
      // Totes les rows haurien de tenir Active = True
      dataRows.forEach((row, idx) => {
        expect(row[activeColIndex], `Row ${idx} hauria de tenir Active=True`).toBe('True');
      });
    });

    it('genera Data Length vàlid per cada signal', () => {
      const result = generateModbusFromKNX(
        inputSignals as KNXSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const dataLengthColIndex = headers.findIndex(h => h === 'Data Length');

      const dataRows = signalsSheet.rows.slice(6);
      
      // Totes les rows haurien de tenir Data Length vàlid (16 o 32)
      dataRows.forEach((row, idx) => {
        const dataLength = row[dataLengthColIndex];
        expect(['16', '32'].includes(dataLength as string), `Row ${idx} hauria de tenir Data Length 16 o 32`).toBe(true);
      });
    });

    it('conté KNX Group Address per totes les signals', () => {
      const result = generateModbusFromKNX(
        inputSignals as KNXSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const groupAddrColIndex = headers.findIndex(h => h === 'Group Address');

      const dataRows = signalsSheet.rows.slice(6);
      
      // Totes les rows haurien de tenir un Group Address
      dataRows.forEach((row, idx) => {
        const gaValue = row[groupAddrColIndex];
        expect(typeof gaValue, `Row ${idx} hauria de tenir Group Address`).toBe('string');
      });
    });

    it('conté signal names de les signals originals', () => {
      const result = generateModbusFromKNX(
        inputSignals as KNXSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const dataRows = signalsSheet.rows.slice(6);

      const firstSignal = inputSignals[0] as KNXSignal;
      const firstRow = dataRows[0];

      // La signal name hauria d'estar en alguna columna
      const hasSignalName = firstRow.some(cell => cell === firstSignal.signalName);
      expect(hasSignalName).toBe(true);
    });
  });
});
