import type { KNXRawSignal, IbmapsDevice } from '../types';
import type { RawWorkbook, RawSheet, CellValue } from '../../excel/raw';

/**
 * Column headers EXACTLY as they appear in knx-to-modbus-master.xlsx template
 * Order: #, Active, Description, DPT, Group Address, Additional Addresses, U, T, Ri, W, R, Priority,
 *        #, Device, # Slave, Base, Read Func, Write Func, Data Length, Format, ByteOrder, Address, Bit, # Bits, Deadband,
 *        Conv. Id, Conversions
 */
const COLUMN_HEADERS = [
  '#',
  'Active',
  'Description',
  'DPT',
  'Group Address',
  'Additional Addresses',
  'U',
  'T',
  'Ri',
  'W',
  'R',
  'Priority',
  '#',
  'Device',
  '# Slave',
  'Base',
  'Read Func',
  'Write Func',
  'Data Length',
  'Format',
  'ByteOrder',
  'Address',
  'Bit',
  '# Bits',
  'Deadband',
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
    ['Intesis MAPS Version', '1.2.23.0', ...empty().slice(2)],
    ['Internal Protocol', 'KNX', ...empty().slice(2)],
    ['External Protocol', 'Modbus Master', ...empty().slice(2)],
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
    '5.001': 'percentage (0..100%)',
    '5.010': 'counter pulses (0..255)',
    '9.001': 'temperature (°C)',
    '12.001': 'counter pulses (unsigned)',
    '13.001': 'counter pulses (signed)',
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

function formatReadFunc(func: number): string {
  if (func <= 0) return '-';
  const funcs: Record<number, string> = {
    1: '1: Read Coils',
    2: '2: Read Discrete Inputs',
    3: '3: Read Holding Registers',
    4: '4: Read Input Registers',
  };
  return funcs[func] || `${func}: Read`;
}

function formatWriteFunc(func: number): string {
  if (func <= 0) return '-';
  const funcs: Record<number, string> = {
    5: '5: Write Single Coil',
    6: '6: Write Single Register',
    15: '15: Write Multiple Coils',
    16: '16: Write Multiple Registers',
  };
  return funcs[func] || `${func}: Write`;
}

/**
 * Converts KNXRawSignal to Excel row format matching template exactly
 */
function createDataRow(
  s: KNXRawSignal,
  idx: number,
  devices: Map<number, IbmapsDevice>,
): CellValue[] {
  const id = idx + 1;
  const dev = devices.get(s.modbus.deviceIndex);
  const deviceName = dev
    ? `RTU // Port B // ${dev.name}`
    : `RTU // Port B // Device ${s.modbus.deviceIndex}`;

  return [
    id, // 0: #
    s.knx.active ? 'True' : 'False', // 1: Active
    s.knx.description, // 2: Description
    formatDPTValue(s.knx.dptValue), // 3: DPT
    s.knx.groupAddress, // 4: Group Address
    s.knx.additionalAddresses || '', // 5: Additional Addresses
    formatFlag(s.knx.flags.u, 'U'), // 6: U
    formatFlag(s.knx.flags.t, 'T'), // 7: T
    formatFlag(s.knx.flags.ri, 'Ri'), // 8: Ri
    formatFlag(s.knx.flags.w, 'W'), // 9: W
    formatFlag(s.knx.flags.r, 'R'), // 10: R
    formatPriority(s.knx.priority), // 11: Priority
    id, // 12: # (Modbus)
    deviceName, // 13: Device
    s.modbus.slaveNum, // 14: # Slave
    '0-based', // 15: Base
    formatReadFunc(s.modbus.readFunc), // 16: Read Func
    formatWriteFunc(s.modbus.writeFunc), // 17: Write Func
    '-', // 18: Data Length
    '-', // 19: Format
    '-', // 20: ByteOrder
    s.modbus.address >= 0 ? s.modbus.address : '-', // 21: Address
    '-', // 22: Bit
    '-', // 23: # Bits
    '-', // 24: Deadband
    '', // 25: Conv. Id
    '-', // 26: Conversions
  ];
}

/**
 * Converts KNXRawSignal objects to a flat RawWorkbook compatible with MAPS Excel format.
 */
export function rawKNXSignalsToWorkbook(
  signals: KNXRawSignal[],
  devices: IbmapsDevice[],
): RawWorkbook {
  const deviceMap = new Map(devices.map((d) => [d.index, d]));

  const metadataRows = createMetadataRows();
  const dataRows = signals.map((s, idx) => createDataRow(s, idx, deviceMap));

  const sheet: RawSheet = {
    name: 'Signals',
    headers: COLUMN_HEADERS,
    rows: [...metadataRows, COLUMN_HEADERS, ...dataRows],
  };

  return { sheets: [sheet] };
}
