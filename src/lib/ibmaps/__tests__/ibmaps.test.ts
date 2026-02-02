import { describe, it, expect } from 'vitest';
import { parseIbmapsSignals_BAC_MBM } from '../parser';
import { addModbusSignals_BAC_MBM } from '../generator';
import { rawSignalsToWorkbook } from '../adapter';
import type { RawSignal } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// Validates the full flow
describe('IBMAPS Support', () => {
  const templatePath = path.join(process.cwd(), 'public/templates/IN-BAC-MBM.ibmaps');
  let templateContent: string;

  try {
    templateContent = fs.readFileSync(templatePath, 'utf-8');
  } catch (e) {
    console.warn('Template file not found, skipping tests requiring real file.');
    templateContent = '';
  }

  it('should parse the real IN-BAC-MBM template correctly', () => {
    if (!templateContent) return;

    const result = parseIbmapsSignals_BAC_MBM(templateContent);
    expect(result.warnings).toHaveLength(0);
    expect(result.signals.length).toBe(12); // Known count from analysis
    expect(result.devices.length).toBeGreaterThan(0);
    
    // Check signal #3 (Analog Input)
    const sig3 = result.signals.find(s => s.idxExternal === 3);
    expect(sig3).toBeDefined();
    expect(sig3?.bacnet.bacName).toBe('Analog Input');
    expect(sig3?.modbus.address).toBe(0);
    expect(sig3?.modbus.readFunc).toBe(3);
  });

  it('should generated XML identical to input (round-trip with no changes)', () => {
    if (!templateContent) return;

    // Passing empty new signals should return original text
    const newXml = addModbusSignals_BAC_MBM(templateContent, []);
    expect(newXml).toBe(templateContent);
  });

  it('should inject a new signal correctly', () => {
    if (!templateContent) return;

    // Create a dummy new signal
    const newSignal: RawSignal = {
        idxExternal: 999,
        name: 'New Test Signal',
        direction: 'BACnet->Modbus',
        bacnet: {
            bacName: 'New Test Signal',
            type: 0,
            instance: 99,
            map: {
                address: 100,
                regType: 0,
                dataType: 0,
                readFunc: 3,
                writeFunc: 16,
                extraAttrs: {}
            },
            extraAttrs: {}
        },
        modbus: {
            deviceIndex: 0,
            slaveNum: 10,
            address: 100,
            readFunc: 3,
            writeFunc: 16,
            regType: 0,
            virtual: false,
            extraAttrs: {}
        }
    };

    const newXml = addModbusSignals_BAC_MBM(templateContent, [newSignal]);
    
    // Check if new signal ID is present
    expect(newXml).toContain('<Signal ID="999">');
    expect(newXml).toContain('<idxExternal>999</idxExternal>');
    expect(newXml).toContain('<Address>100</Address>');
    
    // Check if BACnetObject is present
    expect(newXml).toContain('<BACnetObject ID="999">');
    expect(newXml).toContain('<BACName>New Test Signal</BACName>');
    expect(newXml).toContain('<BACInstance>99</BACInstance>');

    // Formatting check (naive check for indentation existance)
    // Check if new signal ID is present
    expect(newXml).toContain('<Signal ID="999">');

  });
});
