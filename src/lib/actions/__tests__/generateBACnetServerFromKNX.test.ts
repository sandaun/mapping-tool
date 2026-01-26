import { describe, it, expect } from 'vitest';
import { generateBACnetServerFromKNX } from '../generateBACnetServerFromKNX';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { KNXSignal } from '@/lib/deviceSignals';

// Import fixtures
import inputSignals from './fixtures/bacnet-from-knx/input-signals.json';
import inputWorkbook from './fixtures/bacnet-from-knx/input-workbook.json';

describe('generateBACnetServerFromKNX', () => {
  describe('amb fixtures reals', () => {
    it('genera el nombre correcte de rows amb totes les 58 signals', () => {
      const result = generateBACnetServerFromKNX(
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
      const result = generateBACnetServerFromKNX(
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

    it('assigna BACnet Instance numèric per totes les signals', () => {
      const result = generateBACnetServerFromKNX(
        inputSignals as KNXSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const instanceColIndex = headers.findIndex(h => h === 'Instance');

      const dataRows = signalsSheet.rows.slice(6);
      
      // Totes les rows haurien de tenir Instance numèric vàlid
      dataRows.forEach((row, idx) => {
        const instanceValue = row[instanceColIndex];
        expect(typeof instanceValue, `Row ${idx} hauria de tenir Instance numèric`).toBe('number');
        expect(instanceValue, `Row ${idx} Instance hauria de ser >= 0`).toBeGreaterThanOrEqual(0);
      });
    });

    it('genera Active = True per totes les signals', () => {
      const result = generateBACnetServerFromKNX(
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

    it('genera BACnet Type correctament', () => {
      const result = generateBACnetServerFromKNX(
        inputSignals as KNXSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const typeColIndex = headers.findIndex(h => h === 'Type');

      const dataRows = signalsSheet.rows.slice(6);
      
      // Totes les rows haurien de tenir un Type vàlid
      dataRows.forEach((row, idx) => {
        const typeValue = row[typeColIndex];
        expect(typeof typeValue, `Row ${idx} hauria de tenir Type`).toBe('string');
        expect((typeValue as string).length, `Row ${idx} Type no hauria de ser buit`).toBeGreaterThan(0);
      });
    });

    it('conté KNX Group Address per totes les signals', () => {
      const result = generateBACnetServerFromKNX(
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
      const result = generateBACnetServerFromKNX(
        inputSignals as KNXSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const nameColIndex = headers.findIndex(h => h === 'Name');

      const firstSignal = inputSignals[0] as KNXSignal;
      const dataRows = signalsSheet.rows.slice(6);
      const firstRow = dataRows[0];

      expect(firstRow[nameColIndex]).toBe(firstSignal.signalName);
    });
  });
});
