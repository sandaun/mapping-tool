import { describe, it, expect } from 'vitest';
import { generateBACnetFromModbus } from '../generateBACnetFromModbus';
import type { ModbusSignal } from '@/lib/deviceSignals';
import type { RawWorkbook } from '@/lib/excel/raw';

// Import fixtures
import inputSignals from './fixtures/bacnet-from-modbus/input-signals.json';
import inputWorkbook from './fixtures/bacnet-from-modbus/input-workbook.json';

describe('generateBACnetFromModbus', () => {
  // Template buit mínim per testing simple
  const emptyWorkbook: RawWorkbook = {
    sheets: [
      {
        name: 'Signals',
        headers: [
          '#', 'Active', 'Description', 'Name', 'Type', 'Instance', 'Units',
          'NC', 'Texts', '# States', 'Rel. Def.', 'COV',
          '#', 'Device', '# Slave', 'Base', 'Read Func', 'Write Func',
          'Data Length', 'Format', 'ByteOrder', 'Address', 'Bit', '# Bits',
          'Deadband', 'Conv. Id', 'Conversions'
        ],
        rows: [
          ['Internal Protocol', null],
          ['BACnet Server', null],
          ['External Protocol', null],
          ['Modbus Master', null],
          ['Template', null],
          // Row 5 (index 5) són els headers repetits
          [
            '#', 'Active', 'Description', 'Name', 'Type', 'Instance', 'Units',
            'NC', 'Texts', '# States', 'Rel. Def.', 'COV',
            '#', 'Device', '# Slave', 'Base', 'Read Func', 'Write Func',
            'Data Length', 'Format', 'ByteOrder', 'Address', 'Bit', '# Bits',
            'Deadband', 'Conv. Id', 'Conversions'
          ]
        ]
      }
    ]
  };

  describe('amb signals vàlides (tests bàsics)', () => {
    it('genera el nombre correcte de rows', () => {
      const signals: ModbusSignal[] = [
        {
          deviceId: 'device1',
          signalName: 'Temperature',
          registerType: 'HoldingRegister',
          address: 100,
          dataType: 'Float32',
        },
        {
          deviceId: 'device1',
          signalName: 'Pressure',
          registerType: 'InputRegister',
          address: 200,
          dataType: 'Uint16',
        }
      ];

      const result = generateBACnetFromModbus(signals, emptyWorkbook);

      expect(result.rowsAdded).toBe(2);
      expect(result.warnings).toEqual([]);
      expect(result.updatedWorkbook.sheets[0].rows.length).toBe(8); // 6 initial + 2 new
    });

    it('crea rows amb valors no nuls', () => {
      const signals: ModbusSignal[] = [
        {
          deviceId: 'device1',
          signalName: 'Temperature',
          registerType: 'HoldingRegister',
          address: 100,
          dataType: 'Float32',
        }
      ];

      const result = generateBACnetFromModbus(signals, emptyWorkbook);

      const newRow = result.updatedWorkbook.sheets[0].rows[6]; // Primera row nova
      
      // Verificar que s'ha creat una row amb dades
      expect(newRow).toBeDefined();
      expect(newRow.length).toBeGreaterThan(0);
      // Verificar que té el signal name
      expect(newRow).toContain('Temperature');
      // Verificar que té l'address
      expect(newRow).toContain(100);
    });

    it('assigna addresses Modbus correctament', () => {
      const signals: ModbusSignal[] = [
        {
          deviceId: 'device1',
          signalName: 'Temperature',
          registerType: 'HoldingRegister',
          address: 100,
          dataType: 'Float32',
        }
      ];

      const result = generateBACnetFromModbus(signals, emptyWorkbook);

      const newRow = result.updatedWorkbook.sheets[0].rows[6];
      const addressColIndex = 21; // 'Address' column
      
      expect(newRow[addressColIndex]).toBe(100);
    });
  });

  describe('amb fixtures reals', () => {
    it('genera el nombre correcte de rows amb totes les 162 signals', () => {
      const signals = inputSignals as ModbusSignal[];
      const workbook = inputWorkbook as RawWorkbook;
      
      const result = generateBACnetFromModbus(signals, workbook);
      
      expect(result.rowsAdded).toBe(162);
      expect(result.warnings).toEqual([]);
    });

    it('genera BACnet Type correcte per Float32 → AI (Analog Input)', () => {
      const signal: ModbusSignal = {
        deviceId: 'EPM2200',
        signalName: 'Voltage_AN',
        registerType: 'HoldingRegister',
        address: 1000,
        dataType: 'Float32',
        units: 'V',
        mode: 'R',
      };
      
      const result = generateBACnetFromModbus([signal], inputWorkbook as RawWorkbook);
      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const newRow = signalsSheet.rows[signalsSheet.rows.length - 1];
      
      const headers = signalsSheet.rows[5]; // Header row
      const typeColIndex = headers.findIndex(h => h === 'Type');
      
      expect(newRow[typeColIndex]).toBe('0: AI');
    });

    it('genera Data Length correcte per Float32 → 32', () => {
      const signal: ModbusSignal = {
        deviceId: 'EPM2200',
        signalName: 'Voltage_AN',
        registerType: 'HoldingRegister',
        address: 1000,
        dataType: 'Float32',
        units: 'V',
        mode: 'R',
      };
      
      const result = generateBACnetFromModbus([signal], inputWorkbook as RawWorkbook);
      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const newRow = signalsSheet.rows[signalsSheet.rows.length - 1];
      
      const headers = signalsSheet.rows[5];
      const dataLengthColIndex = headers.findIndex(h => h === 'Data Length');
      
      expect(newRow[dataLengthColIndex]).toBe('32');
    });

    it('genera Data Length correcte per Uint16 → 16', () => {
      const signal: ModbusSignal = {
        deviceId: 'EPM2200',
        signalName: 'MeterType',
        registerType: 'HoldingRegister',
        address: 17,
        dataType: 'Uint16',
        mode: 'R',
      };
      
      const result = generateBACnetFromModbus([signal], inputWorkbook as RawWorkbook);
      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const newRow = signalsSheet.rows[signalsSheet.rows.length - 1];
      
      const headers = signalsSheet.rows[5];
      const dataLengthColIndex = headers.findIndex(h => h === 'Data Length');
      
      expect(newRow[dataLengthColIndex]).toBe('16');
    });

    it('genera Format correcte per Float32 → 3: Float', () => {
      const signal: ModbusSignal = {
        deviceId: 'EPM2200',
        signalName: 'Voltage_AN',
        registerType: 'HoldingRegister',
        address: 1000,
        dataType: 'Float32',
        units: 'V',
        mode: 'R',
      };
      
      const result = generateBACnetFromModbus([signal], inputWorkbook as RawWorkbook);
      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const newRow = signalsSheet.rows[signalsSheet.rows.length - 1];
      
      const headers = signalsSheet.rows[5];
      const formatColIndex = headers.findIndex(h => h === 'Format');
      
      expect(newRow[formatColIndex]).toBe('3: Float');
    });

    it('genera ByteOrder correcte → 0: Big Endian', () => {
      const signal: ModbusSignal = {
        deviceId: 'EPM2200',
        signalName: 'Voltage_AN',
        registerType: 'HoldingRegister',
        address: 1000,
        dataType: 'Float32',
        units: 'V',
        mode: 'R',
      };
      
      const result = generateBACnetFromModbus([signal], inputWorkbook as RawWorkbook);
      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const newRow = signalsSheet.rows[signalsSheet.rows.length - 1];
      
      const headers = signalsSheet.rows[5];
      const byteOrderColIndex = headers.findIndex(h => h === 'ByteOrder');
      
      expect(newRow[byteOrderColIndex]).toBe('0: Big Endian');
    });

    it('genera Read Func correcte per HoldingRegister mode R → 3: Read Holding Registers', () => {
      const signal: ModbusSignal = {
        deviceId: 'EPM2200',
        signalName: 'Voltage_AN',
        registerType: 'HoldingRegister',
        address: 1000,
        dataType: 'Float32',
        units: 'V',
        mode: 'R',
      };
      
      const result = generateBACnetFromModbus([signal], inputWorkbook as RawWorkbook);
      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      const newRow = signalsSheet.rows[signalsSheet.rows.length - 1];
      
      const headers = signalsSheet.rows[5];
      const readFuncColIndex = headers.findIndex(h => h === 'Read Func');
      
      expect(newRow[readFuncColIndex]).toBe('3: Read Holding Registers');
    });

    it('assigna Instance incremental correctament', () => {
      const signals: ModbusSignal[] = [
        {
          deviceId: 'EPM2200',
          signalName: 'Signal1',
          registerType: 'HoldingRegister',
          address: 1,
          dataType: 'Uint16',
          mode: 'R',
        },
        {
          deviceId: 'EPM2200',
          signalName: 'Signal2',
          registerType: 'HoldingRegister',
          address: 2,
          dataType: 'Uint16',
          mode: 'R',
        },
      ];
      
      const result = generateBACnetFromModbus(signals, inputWorkbook as RawWorkbook);
      const signalsSheet = result.updatedWorkbook.sheets.find(s => s.name === 'Signals')!;
      
      const headers = signalsSheet.rows[5];
      const instanceColIndex = headers.findIndex(h => h === 'Instance');
      
      const row1 = signalsSheet.rows[signalsSheet.rows.length - 2];
      const row2 = signalsSheet.rows[signalsSheet.rows.length - 1];
      
      const instance1 = row1[instanceColIndex] as number;
      const instance2 = row2[instanceColIndex] as number;
      
      expect(instance2).toBe(instance1 + 1);
    });
  });

  describe('amb signals buides', () => {
    it('no afegeix cap row', () => {
      const initialRowCount = emptyWorkbook.sheets[0].rows.length;
      const result = generateBACnetFromModbus([], emptyWorkbook);

      expect(result.rowsAdded).toBe(0);
      expect(result.warnings).toEqual([]);
      // El workbook es retorna amb el mateix nombre de rows
      expect(result.updatedWorkbook.sheets[0].rows.length).toBe(initialRowCount);
    });
  });

  describe('sense sheet Signals', () => {
    it('retorna warning', () => {
      const invalidWorkbook: RawWorkbook = {
        sheets: []
      };

      const result = generateBACnetFromModbus([], invalidWorkbook);

      expect(result.rowsAdded).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Signals');
    });
  });
});
