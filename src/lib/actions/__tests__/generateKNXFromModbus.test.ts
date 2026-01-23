import { describe, it, expect } from 'vitest';
import { generateKNXFromModbus } from '../generateKNXFromModbus';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { ModbusSignal } from '@/lib/deviceSignals';

// Import fixtures
import inputSignals from './fixtures/knx-from-modbus/input-signals.json';
import inputWorkbook from './fixtures/knx-from-modbus/input-workbook.json';

describe('generateKNXFromModbus', () => {
  describe('amb fixtures reals', () => {
    it('genera el nombre correcte de rows amb totes les 162 signals', () => {
      const result = generateKNXFromModbus(
        inputSignals as ModbusSignal[],
        inputWorkbook as RawWorkbook
      );

      expect(result.rowsAdded).toBe(162);
      expect(result.warnings).toHaveLength(0);
      
      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals');
      expect(signalsSheet).toBeDefined();
      
      // Headers at row 5 (index 5), so data starts at row 6
      const dataRows = signalsSheet!.rows.slice(6);
      expect(dataRows).toHaveLength(162);
    });

    it('genera KNX DPT vàlid per Float32', () => {
      // Troba índex de primera signal Float32 al input
      const float32Index = (inputSignals as ModbusSignal[]).findIndex(s => s.dataType === 'Float32');
      expect(float32Index).toBeGreaterThanOrEqual(0);

      const result = generateKNXFromModbus(
        inputSignals as ModbusSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const dptColIndex = headers.findIndex(h => h === 'DPT');

      // Les rows de dades comencen a index 6, agafem la row corresponent
      const float32Row = signalsSheet.rows[6 + float32Index];
      const dptValue = float32Row[dptColIndex];
      
      expect(typeof dptValue).toBe('string');
      // Float32 pot ser DPT 9.* (2 bytes float) o DPT 14.* (4 bytes float)
      const isValidDPT = (dptValue as string).startsWith('9.') || (dptValue as string).startsWith('14.');
      expect(isValidDPT).toBe(true);
    });

    it('genera KNX DPT correcte per Uint16 → DPT 5.* o 7.*', () => {
      // Troba índex de primera signal Uint16 al input
      const uint16Index = (inputSignals as ModbusSignal[]).findIndex(s => s.dataType === 'Uint16');
      expect(uint16Index).toBeGreaterThanOrEqual(0);

      const result = generateKNXFromModbus(
        inputSignals as ModbusSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const dptColIndex = headers.findIndex(h => h === 'DPT');

      // Les rows de dades comencen a index 6, agafem la row corresponent
      const uint16Row = signalsSheet.rows[6 + uint16Index];
      const dptValue = uint16Row[dptColIndex];
      
      expect(typeof dptValue).toBe('string');
      // Uint16 pot ser DPT 5.* (1 byte) o DPT 7.* (2 bytes unsigned)
      const startsWithValid = (dptValue as string).startsWith('5.') || (dptValue as string).startsWith('7.');
      expect(startsWithValid).toBe(true);
    });

    it('genera Group Address incremental correctament', () => {
      const result = generateKNXFromModbus(
        inputSignals as ModbusSignal[],
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

    it('genera Data Length correcte per Float32 → 32', () => {
      const float32Index = (inputSignals as ModbusSignal[]).findIndex(s => s.dataType === 'Float32');
      expect(float32Index).toBeGreaterThanOrEqual(0);

      const result = generateKNXFromModbus(
        inputSignals as ModbusSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const dataLengthColIndex = headers.findIndex(h => h === 'Data Length');

      const float32Row = signalsSheet.rows[6 + float32Index];
      expect(float32Row[dataLengthColIndex]).toBe('32');
    });

    it('genera Data Length correcte per Uint16 → 16', () => {
      const uint16Index = (inputSignals as ModbusSignal[]).findIndex(s => s.dataType === 'Uint16');
      expect(uint16Index).toBeGreaterThanOrEqual(0);

      const result = generateKNXFromModbus(
        inputSignals as ModbusSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const dataLengthColIndex = headers.findIndex(h => h === 'Data Length');

      const uint16Row = signalsSheet.rows[6 + uint16Index];
      expect(uint16Row[dataLengthColIndex]).toBe('16');
    });

    it('genera Format correcte per Float32 → 3: Float', () => {
      const float32Index = (inputSignals as ModbusSignal[]).findIndex(s => s.dataType === 'Float32');
      expect(float32Index).toBeGreaterThanOrEqual(0);

      const result = generateKNXFromModbus(
        inputSignals as ModbusSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const formatColIndex = headers.findIndex(h => h === 'Format');

      const float32Row = signalsSheet.rows[6 + float32Index];
      expect(float32Row[formatColIndex]).toBe('3: Float');
    });

    it('genera ByteOrder correcte → 0: Big Endian', () => {
      const result = generateKNXFromModbus(
        inputSignals as ModbusSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const byteOrderColIndex = headers.findIndex(h => h === 'ByteOrder');

      const dataRows = signalsSheet.rows.slice(6);
      const firstRow = dataRows[0];

      // Per HoldingRegister/InputRegister hauria de ser Big Endian
      expect(firstRow[byteOrderColIndex]).toBe('0: Big Endian');
    });

    it('genera Read Func correcte per HoldingRegister mode R → 3: Read Holding Registers', () => {
      // Totes les signals del CSV són HoldingRegister amb mode R
      const holdingIndex = (inputSignals as ModbusSignal[]).findIndex(
        s => s.registerType === 'HoldingRegister' && s.mode === 'R'
      );
      expect(holdingIndex).toBeGreaterThanOrEqual(0);

      const result = generateKNXFromModbus(
        inputSignals as ModbusSignal[],
        inputWorkbook as RawWorkbook
      );

      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const headers = signalsSheet.rows[5];
      const readFuncColIndex = headers.findIndex(h => h === 'Read Func');

      const newRow = signalsSheet.rows[6 + holdingIndex];
      expect(newRow[readFuncColIndex]).toBe('3: Read Holding Registers');
    });
  });
});
