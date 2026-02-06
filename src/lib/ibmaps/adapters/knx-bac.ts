import type { KNXBACRawSignal } from '../types';
import type { RawWorkbook, RawSheet, CellValue } from '../../excel/raw';

/**
 * Column headers EXACTLY as they appear in knx-to-bacnet-client.xlsx template
 * Order: 
 * Internal (KNX): #, Active, Description, DPT, Group Address, Additional Addresses, U, T, Ri, W, R
 * External (BACnet Client): #, Device Name, Type, Instance
 * Extra: Conv. Id, Conversions
 */
const COLUMN_HEADERS = [
  // Internal (KNX)
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
    ['Internal Protocol', 'KNX', ...empty().slice(2)],
    ['External Protocol', 'BACnet Client', ...empty().slice(2)],
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
    '1.007': 'step',
    '1.008': 'up/down',
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
    '20.105': 'HVAC mode',
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
 * Format BACnet type for display
 */
function formatBacType(type: number): string {
  const name = BAC_TYPE_NAMES[type];
  return name ? `${type}: ${name}` : `${type}`;
}

/**
 * Converts KNXBACRawSignal to Excel row format matching template exactly
 */
function createDataRow(s: KNXBACRawSignal, idx: number): CellValue[] {
  const id = idx + 1;
  const k = s.knx;
  const b = s.bacnetClient;

  return [
    // Internal (KNX)
    id, // #
    k.active ? 'True' : 'False', // Active
    k.description || '', // Description
    formatDPTValue(k.dptValue), // DPT
    k.groupAddress, // Group Address
    k.additionalAddresses || '', // Additional Addresses
    formatFlag(k.flags.u, 'U'), // U
    formatFlag(k.flags.t, 'T'), // T
    formatFlag(k.flags.ri, 'Ri'), // Ri
    formatFlag(k.flags.w, 'W'), // W
    formatFlag(k.flags.r, 'R'), // R
    // External (BACnet Client)
    id, // #
    b.deviceName, // Device Name
    formatBacType(b.bacType), // Type
    b.bacInstance, // Instance
    // Extra
    '', // Conv. Id
    '-', // Conversions
  ];
}

/**
 * Converts KNXBACRawSignal objects to a flat RawWorkbook compatible with MAPS Excel format.
 */
export function rawKNXBACSignalsToWorkbook(
  signals: KNXBACRawSignal[],
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
