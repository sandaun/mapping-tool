import type { RawSignal, IbmapsDevice } from './types';
import type { RawWorkbook, RawSheet, CellValue } from '../excel/raw';

/**
 * Columns defined in the Excel template for IN-BAC-MBM
 */
const HEADERS = [
  '#',
  'Description',
  'Name', // BACName
  'Type',
  'Instance',
  'Units',
  'NC',
  'Texts',
  '# States',
  'Rel. Def.',
  'COV',
  'Active',
  // External Columns (Modbus) start here usually, but let's list them all flattened
  // Note: Detailed column order matches public/templates/bacnet-server-to-modbus-master.xlsx
  // But strictly looking at sample files, we have:
  // Internal: #, Description, Name, Type, Instance, Units, NC, Texts, # States, Rel. Def., COV, Active
  // External: #, Device, # Slave, Base, Read Func, Write Func, Data Length, Format, ByteOrder, Address, Bit, # Bits, Deadband
  // Extra: Conv. Id, Conversions
];

// Re-defining for clarity based on observed file `IN-BAC-MBM.ibmaps` <Columns> section:
const INTERNAL_COLS = [
  '#', 'Description', 'Name', 'Type', 'Instance', 'Units', 'NC', 'Texts', '# States', 'Rel. Def.', 'COV', 'Active'
];

const EXTERNAL_COLS = [
  '#', 'Device', '# Slave', 'Base', 'Read Func', 'Write Func', 'Data Length', 'Format', 'ByteOrder', 'Address', 'Bit', '# Bits', 'Deadband'
];

const EXTRA_COLS = [
  'Conv. Id', 'Conversions'
];

const ALL_HEADERS = [...INTERNAL_COLS, ...EXTERNAL_COLS, ...EXTRA_COLS];

/**
 * Converts rich RawSignal objects to a flat RawWorkbook compatible with the Excel export engine.
 * 
 * @param signals List of RawSignals
 * @param devices List of Devices (for resolving names)
 * @returns RawWorkbook ready for xlsx serialization
 */
export function rawSignalsToWorkbook(signals: RawSignal[], devices: IbmapsDevice[]): RawWorkbook {
  const deviceMap = new Map(devices.map(d => [d.index, d]));

  const rows: CellValue[][] = signals.map((s, idx) => {
    const row: CellValue[] = new Array(ALL_HEADERS.length).fill(null);
    
    // Internal Protocol (BACnet)
    // Offset 0
    row[0] = idx; // #
    row[1] = s.bacnet.extraAttrs['Description'] || ''; // Description (XML attr, not Signal description)
    row[2] = s.name; // Name (BACName)
    row[3] = s.bacnet.type; // Type
    row[4] = s.bacnet.instance; // Instance
    row[5] = s.bacnet.units ?? -1; // Units
    row[6] = -1; // NC
    row[7] = -1; // Texts
    row[8] = -1; // # States
    row[9] = -1; // Rel. Def.
    row[10] = -1; // COV
    row[11] = 'True'; // Active (defaulting to True for export as per template usually)

    // External Protocol (Modbus)
    // Offset 12 (INTERNAL_COLS.length)
    const extOffset = INTERNAL_COLS.length;
    const dev = deviceMap.get(s.modbus.deviceIndex);
    
    row[extOffset + 0] = idx; // # (External)
    row[extOffset + 1] = dev ? dev.name : `Device ${s.modbus.deviceIndex}`; // Device Name
    row[extOffset + 2] = s.modbus.slaveNum; // # Slave
    row[extOffset + 3] = dev?.baseRegister ?? 0; // Base
    row[extOffset + 4] = s.modbus.readFunc; // Read Func
    row[extOffset + 5] = s.modbus.writeFunc; // Write Func
    row[extOffset + 6] = -1; // Data Length (Not explicitly in RawSignal, defaulting)
    row[extOffset + 7] = s.modbus.regType ?? 99; // Format (Mapped to RegType/Format in XML)
    row[extOffset + 8] = 255; // ByteOrder
    row[extOffset + 9] = s.modbus.address; // Address
    row[extOffset + 10] = -1; // Bit
    row[extOffset + 11] = 1; // # Bits
    row[extOffset + 12] = 0; // Deadband

    // Extra
    const extraOffset = extOffset + EXTERNAL_COLS.length;
    row[extraOffset + 0] = -1; // Conv. Id
    row[extraOffset + 1] = ''; // Conversions

    return row;
  });

  const sheet: RawSheet = {
    name: 'Signals',
    headers: ALL_HEADERS,
    rows
  };

  return {
    sheets: [sheet]
  };
}
