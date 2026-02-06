import type { MBSKNXRawSignal } from '../types';
import type { RawWorkbook, RawSheet, CellValue } from '../../excel/raw';

/**
 * Column headers EXACTLY as they appear in modbus-slave-to-knx.xlsx template
 * Order: 
 * Internal (Modbus Slave): #, Active, Description, Data Length, Format, Address, Bit, Read / Write, String Length
 * External (KNX): #, DPT, Group Address, Additional Addresses, U, T, Ri, W, R, Priority
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
  // External (KNX)
  '#',
  'DPT',
  'Group Address',
  'Additional Addresses',
  'U',
  'T',
  'Ri',
  'W',
  'R',
  'Priority',
  // Extra
  'Conv. Id',
  'Conversions',
];

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
    ['External Protocol', 'KNX', ...empty().slice(2)],
    ['Timestamp', new Date().toLocaleDateString(), ...empty().slice(2)],
  ];
}

/**
 * Convert numeric DPT value to display format
 * DPT value = main*256 + sub → "main.sub: name"
 */
function formatDPTValue(dptValue: number): string {
  if (dptValue < 0) return '-';
  const main = Math.floor(dptValue / 256);
  const sub = dptValue % 256;
  const dptCode = `${main}.${sub.toString().padStart(3, '0')}`;

  // Common DPT names
  const dptNames: Record<string, string> = {
    '1.001': 'switch',
    '1.002': 'boolean',
    '1.003': 'enable',
    '1.005': 'alarm',
    '1.011': 'state',
    '3.007': 'dimming control',
    '4.001': 'character (ASCII)',
    '5.001': 'percentage (0..100%)',
    '5.010': 'counter pulses (0..255)',
    '9.001': 'temperature (°C)',
    '9.005': 'wind speed (m/s)',
    '12.001': 'counter pulses (unsigned)',
    '13.001': 'counter pulses (signed)',
    '14.056': 'power (W)',
  };

  const name = dptNames[dptCode];
  return name ? `${dptCode}: ${name}` : dptCode;
}

/**
 * Format flag as display string
 */
function formatFlag(value: boolean, label: string): string {
  return value ? label : ' ';
}

/**
 * Format Priority value
 */
function formatPriority(priority: number): string {
  const priorities: Record<number, string> = {
    0: '0: System',
    1: '1: Normal',
    2: '2: Urgent',
    3: '3: Low',
  };
  return priorities[priority] || `${priority}: Low`;
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
 * Converts MBSKNXRawSignal to Excel row format matching template exactly
 */
function createDataRow(s: MBSKNXRawSignal, idx: number): CellValue[] {
  const id = idx + 1;

  return [
    // Internal (Modbus Slave)
    id, // 0: #
    s.modbusSlave.isEnabled ? 'True' : 'False', // 1: Active
    s.modbusSlave.description, // 2: Description
    formatDataLength(s.modbusSlave.dataLength), // 3: Data Length
    formatFormatCode(s.modbusSlave.format), // 4: Format
    s.modbusSlave.address, // 5: Address
    s.modbusSlave.bit >= 0 ? s.modbusSlave.bit : '-', // 6: Bit
    formatReadWrite(s.modbusSlave.readWrite), // 7: Read / Write
    s.modbusSlave.stringLength >= 0 ? s.modbusSlave.stringLength : '-', // 8: String Length
    // External (KNX)
    id, // 9: #
    formatDPTValue(s.knx.dptValue), // 10: DPT
    s.knx.groupAddress, // 11: Group Address
    s.knx.additionalAddresses || '', // 12: Additional Addresses
    formatFlag(s.knx.flags.u, 'U'), // 13: U
    formatFlag(s.knx.flags.t, 'T'), // 14: T
    formatFlag(s.knx.flags.ri, 'Ri'), // 15: Ri
    formatFlag(s.knx.flags.w, 'W'), // 16: W
    formatFlag(s.knx.flags.r, 'R'), // 17: R
    formatPriority(s.knx.priority), // 18: Priority
    // Extra
    '', // 19: Conv. Id
    '-', // 20: Conversions
  ];
}

/**
 * Converts MBSKNXRawSignal objects to a flat RawWorkbook compatible with MAPS Excel format.
 */
export function rawMBSKNXSignalsToWorkbook(
  signals: MBSKNXRawSignal[],
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
