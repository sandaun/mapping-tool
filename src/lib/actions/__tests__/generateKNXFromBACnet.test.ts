import { describe, it, expect } from 'vitest';
import { generateKNXFromBACnet } from '../generateKNXFromBACnet';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { BACnetSignal } from '@/lib/deviceSignals';

// Import fixtures
import inputSignals from './fixtures/knx-from-bacnet/input-signals.json';
import inputWorkbook from './fixtures/knx-from-bacnet/input-workbook.json';

describe('generateKNXFromBACnet', () => {
  describe('amb fixtures reals', () => {
    it('genera el nombre correcte de rows amb totes les 23 signals', () => {
      const result = generateKNXFromBACnet(
        inputSignals as BACnetSignal[],
        inputWorkbook as RawWorkbook
      );

      expect(result.rowsAdded).toBe(23);
      expect(result.warnings).toHaveLength(0);
      
      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals');
      expect(signalsSheet).toBeDefined();
      
      // Headers at row 5 (index 5), so data starts at row 6
      const dataRows = signalsSheet!.rows.slice(6);
      expect(dataRows).toHaveLength(23);
    });

    it('genera rows amb valors no nuls per totes les signals', () => {
      const result = generateKNXFromBACnet(
        inputSignals as BACnetSignal[],
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

    it('assigna Group Address incremental correctament', () => {
      const result = generateKNXFromBACnet(
        inputSignals as BACnetSignal[],
        inputWorkbook as RawWorkbook,
        { startGroupAddress: '0/0/1' }
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const groupAddrColIndex = headers.findIndex(h => h === 'Group Address');

      const dataRows = signalsSheet.rows.slice(6);
      
      // Primera row hauria de tenir 0/0/1
      expect(dataRows[0][groupAddrColIndex]).toBe('0/0/1');
      
      // Segona row hauria de tenir 0/0/2
      expect(dataRows[1][groupAddrColIndex]).toBe('0/0/2');
      
      // Última row hauria de tenir un Group Address vàlid
      const lastGA = dataRows[dataRows.length - 1][groupAddrColIndex];
      expect(typeof lastGA).toBe('string');
      expect((lastGA as string).match(/^\d+\/\d+\/\d+$/)).toBeTruthy();
    });

    it('conté Group Addresses per totes les signals', () => {
      const result = generateKNXFromBACnet(
        inputSignals as BACnetSignal[],
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

    it('genera Active = True per totes les signals', () => {
      const result = generateKNXFromBACnet(
        inputSignals as BACnetSignal[],
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

    it('genera BACnet Instance correctament', () => {
      const result = generateKNXFromBACnet(
        inputSignals as BACnetSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const instanceColIndex = headers.findIndex(h => h === 'Instance');

      const firstSignal = inputSignals[0] as BACnetSignal;
      const dataRows = signalsSheet.rows.slice(6);
      const firstRow = dataRows[0];

      expect(firstRow[instanceColIndex]).toBe(firstSignal.instance);
    });

    it('genera BACnet Type amb format correcte', () => {
      const result = generateKNXFromBACnet(
        inputSignals as BACnetSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const typeColIndex = headers.findIndex(h => h === 'Type');

      const dataRows = signalsSheet.rows.slice(6);
      const firstRow = dataRows[0];

      // Type hauria de contenir el objectType de la signal
      expect(typeof firstRow[typeColIndex]).toBe('string');
      const firstSignal = inputSignals[0] as BACnetSignal;
      expect((firstRow[typeColIndex] as string).includes(firstSignal.objectType)).toBe(true);
    });
  });
});
