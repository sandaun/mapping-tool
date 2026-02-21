import type { RawSignal, IbmapsDevice } from '../types';
import type { RawWorkbook, RawSheet, CellValue } from '../../excel/raw';

/**
 * Column headers EXACTLY as they appear in bacnet-server-to-modbus-master.xlsx template
 * Order: #, Active, Description, Name, Type, Instance, Units, NC, Texts, # States, Rel. Def., COV, #, Device...
 */
const COLUMN_HEADERS = [
  '#',
  'Active',
  'Description',
  'Name',
  'Type',
  'Instance',
  'Units',
  'NC',
  'Texts',
  '# States',
  'Rel. Def.',
  'COV',
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
    ['Internal Protocol', 'BACnet Server', ...empty().slice(2)],
    ['External Protocol', 'Modbus Master', ...empty().slice(2)],
    ['Timestamp', new Date().toLocaleDateString(), ...empty().slice(2)],
  ];
}

/**
 * Converts RawSignal to Excel row format matching template exactly
 */
function createDataRow(
  s: RawSignal,
  idx: number,
  devices: Map<number, IbmapsDevice>,
): CellValue[] {
  const id = idx + 1; // 1-based index
  const dev = devices.get(s.modbus.deviceIndex);
  const deviceName = dev
    ? `RTU // Port A // ${dev.name}`
    : `RTU // Port A // Device ${s.modbus.deviceIndex}`;

  return [
    id, // 0: #
    'True', // 1: Active
    '', // 2: Description
    s.name, // 3: Name
    formatType(s.bacnet.type), // 4: Type
    s.bacnet.instance, // 5: Instance
    s.bacnet.units ?? -1, // 6: Units
    '-', // 7: NC
    '-', // 8: Texts
    getNumStates(s.bacnet.type), // 9: # States
    '-', // 10: Rel. Def.
    '-', // 11: COV
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
    '', // 26: Conversions
  ];
}

/**
 * Converts rich RawSignal objects to a flat RawWorkbook compatible with MAPS Excel format.
 *
 * The sheet.rows contains: metadata rows (6) + header row + data rows
 * The sheet.headers is for UI reference only
 */
export function rawSignalsToWorkbook(
  signals: RawSignal[],
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

// Helper functions
function formatType(type: number): string {
  const types: Record<number, string> = {
    0: '0: AI',
    1: '1: AO',
    2: '2: AV',
    3: '3: BI',
    4: '4: BO',
    5: '5: BV',
    13: '13: MI',
    14: '14: MO',
    19: '19: MV',
  };
  return types[type] || `${type}: AI`;
}

function getNumStates(type: number): string {
  if (type === 3 || type === 4 || type === 5) return '2';
  if (type === 13 || type === 14 || type === 19) return '65535';
  return '-';
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
