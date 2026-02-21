import type { MBSBACRawSignal } from '../types';
import type { RawWorkbook, RawSheet, CellValue } from '../../excel/raw';

/**
 * Column headers EXACTLY as they appear in modbus-slave-to-bacnet-client.xlsx template
 * Order: 
 * Internal (Modbus Slave): #, Active, Description, Data Length, Format, Address, Bit, Read / Write, String Length
 * External (BACnet Client): #, Device Name, Type, Instance
 * Extra: Conv. Id, Conversions
 */
const COLUMN_HEADERS = [
  // Internal (Modbus Slave)
  '#',
  'Active',
  'Description',
  'Data Length',
  'Format',
  'Address',
  'Bit',
  'Read / Write',
  'String Length',
  // External (BACnet Client)
  '#',
  'Device Name',
  'Type',
  'Instance',
  // Extra
  'Conv. Id',
  'Conversions',
];

// BACnet object type mappings
const BAC_TYPE_NAMES: Record<number, string> = {
  0: 'AI',
  1: 'AO',
  2: 'AV',
  3: 'BI',
  4: 'BO',
  5: 'BV',
  13: 'MI',
  14: 'MO',
  19: 'MV',
};

/**
 * Creates the 6 metadata rows for MAPS Excel format
 */
function createMetadataRows(): CellValue[][] {
  const numCols = COLUMN_HEADERS.length;
  const empty = () => new Array(numCols).fill('');

  return [
    ['Intesis MAPS Excel signals file', ...empty().slice(1)],
    ['PROJECT_NAME', 'Project1', ...empty().slice(2)],
    ['Intesis MAPS Version', '1.2.26.0', ...empty().slice(2)],
    ['Internal Protocol', 'Modbus Slave', ...empty().slice(2)],
    ['External Protocol', 'BACnet Client', ...empty().slice(2)],
    ['Timestamp', new Date().toLocaleDateString(), ...empty().slice(2)],
  ];
}

/**
 * Format Data Length value
 * LenBits to display string
 */
function formatDataLength(lenBits: number): string {
  const lengths: Record<number, string> = {
    16: '16: 1 Register (16 bits)',
    32: '32: 2 Registers (32 bits)',
    64: '64: 4 Registers (64 bits)',
  };
  return lengths[lenBits] || `${lenBits}: ${lenBits / 16} Register(s)`;
}

/**
 * Format Format value
 * Format code to display string
 */
function formatFormatCode(format: number): string {
  const formats: Record<number, string> = {
    0: '0: Unsigned',
    1: '1: Signed',
    2: '2: Binary',
    3: '3: Float',
    4: '4: Bit-field',
    5: '5: String',
  };
  return formats[format] || `${format}: Unknown`;
}

/**
 * Format Read/Write mode
 */
function formatReadWrite(readWrite: number): string {
  const modes: Record<number, string> = {
    0: '0: Read',
    1: '1: Write',
    2: '2: Read / Write',
  };
  return modes[readWrite] || `${readWrite}: Unknown`;
}

/**
 * Format BACnet type for display
 */
function formatBacType(type: number): string {
  const name = BAC_TYPE_NAMES[type];
  return name ? `${type}: ${name}` : `${type}`;
}

/**
 * Converts MBSBACRawSignal to Excel row format matching template exactly
 */
function createDataRow(s: MBSBACRawSignal, idx: number): CellValue[] {
  const id = idx + 1;
  const m = s.modbusSlave;
  const b = s.bacnetClient;

  return [
    // Internal (Modbus Slave)
    id, // 0: #
    m.isEnabled ? 'True' : 'False', // 1: Active
    m.description, // 2: Description
    formatDataLength(m.dataLength), // 3: Data Length
    formatFormatCode(m.format), // 4: Format
    m.address, // 5: Address
    m.bit >= 0 ? m.bit : '-', // 6: Bit
    formatReadWrite(m.readWrite), // 7: Read / Write
    m.stringLength >= 0 ? m.stringLength : '-', // 8: String Length
    // External (BACnet Client)
    id, // 9: #
    b.deviceName, // 10: Device Name
    formatBacType(b.bacType), // 11: Type
    b.bacInstance, // 12: Instance
    // Extra
    '', // 13: Conv. Id
    '-', // 14: Conversions
  ];
}

/**
 * Converts MBSBACRawSignal objects to a flat RawWorkbook compatible with MAPS Excel format.
 */
export function rawMBSBACSignalsToWorkbook(
  signals: MBSBACRawSignal[],
): RawWorkbook {
  const metadataRows = createMetadataRows();
  const dataRows = signals.map((s, idx) => createDataRow(s, idx));

  const sheet: RawSheet = {
    name: 'Signals',
    headers: COLUMN_HEADERS,
    rows: [...metadataRows, COLUMN_HEADERS, ...dataRows],
  };

  return { sheets: [sheet] };
}
