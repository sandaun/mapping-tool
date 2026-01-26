import { describe, it, expect } from 'vitest';
import { generateModbusFromBACnet } from '../generateModbusFromBACnet';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { BACnetSignal } from '@/lib/deviceSignals';

// Import fixtures
import inputSignals from './fixtures/modbus-from-bacnet/input-signals.json';
import inputWorkbook from './fixtures/modbus-from-bacnet/input-workbook.json';

describe('generateModbusFromBACnet', () => {
  describe('amb fixtures reals', () => {
    it('genera el nombre correcte de rows amb totes les 23 signals', () => {
      const result = generateModbusFromBACnet(
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
      const result = generateModbusFromBACnet(
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

    it('assigna ID incremental a cada row', () => {
      const result = generateModbusFromBACnet(
        inputSignals as BACnetSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const idColIndex = headers.findIndex(h => h === '#');

      const dataRows = signalsSheet.rows.slice(6);
      
      // Primera row hauria de tenir ID
      expect(dataRows[0][idColIndex]).toBeDefined();
      expect(typeof dataRows[0][idColIndex]).toBe('number');
      
      // IDs haurien de ser consecutius o incrementals
      const firstId = dataRows[0][idColIndex] as number;
      expect(dataRows[1][idColIndex]).toBeGreaterThanOrEqual(firstId);
    });

    it('genera Active = True per totes les signals', () => {
      const result = generateModbusFromBACnet(
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

    it('assigna addresses Modbus incrementals', () => {
      const result = generateModbusFromBACnet(
        inputSignals as BACnetSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const addressColIndex = headers.findIndex(h => h === 'Address');

      const dataRows = signalsSheet.rows.slice(6);
      
      // Primera row hauria de tenir address numèric
      expect(typeof dataRows[0][addressColIndex]).toBe('number');
      
      // Última row hauria de tenir un address més gran o igual
      const firstAddress = dataRows[0][addressColIndex] as number;
      const lastAddress = dataRows[dataRows.length - 1][addressColIndex] as number;
      expect(lastAddress).toBeGreaterThanOrEqual(firstAddress);
    });

    it('genera BACnet Instance correctament', () => {
      const result = generateModbusFromBACnet(
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
      const result = generateModbusFromBACnet(
        inputSignals as BACnetSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const typeColIndex = headers.findIndex(h => h === 'Type');

      const aiIndex = (inputSignals as BACnetSignal[]).findIndex(s => s.objectType === 'AI');
      const dataRows = signalsSheet.rows.slice(6);
      const aiRow = dataRows[aiIndex];

      // Type hauria de ser "0: AI" format
      expect(typeof aiRow[typeColIndex]).toBe('string');
      expect((aiRow[typeColIndex] as string).includes('AI')).toBe(true);
    });
  });
});
