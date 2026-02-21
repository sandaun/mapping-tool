import type { BACKNXRawSignal } from '../types';
import type { RawWorkbook, RawSheet, CellValue } from '../../excel/raw';

/**
 * Column headers EXACTLY as they appear in bacnet-server-to-knx.xlsx template
 * Order: #, Active, Description, Name, Type, Instance, Units, NC, Texts, # States, Rel. Def., COV,
 *        #, DPT, Group Address, Additional Addresses, U, T, Ri, W, R, Priority,
 *        Conv. Id, Conversions
 */
const COLUMN_HEADERS = [
  // Internal (BACnet Server)
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

// BACnet units (common ones)
const BAC_UNITS_NAMES: Record<number, string> = {
  62: 'degrees-celsius',
  64: 'degrees-fahrenheit',
  95: 'no-units',
  98: 'percent',
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
    ['Internal Protocol', 'BACnet Server', ...empty().slice(2)],
    ['External Protocol', 'KNX', ...empty().slice(2)],
    ['Timestamp', new Date().toLocaleDateString(), ...empty().slice(2)],
  ];
}

/**
 * Format BACnet type for display
 */
function formatBacType(type: number): string {
  const name = BAC_TYPE_NAMES[type];
  return name ? `${type}: ${name}` : `${type}`;
}

/**
 * Format BACnet units for display
 */
function formatBacUnits(units: number | undefined): string {
  if (units === undefined || units < 0) return '-';
  const name = BAC_UNITS_NAMES[units];
  return name ? `${units}: ${name}` : `${units}`;
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
    '5.001': 'percentage (0..100%)',
    '5.010': 'counter pulses (0..255)',
    '9.001': 'temperature (°C)',
    '12.001': 'counter pulses (unsigned)',
    '13.001': 'counter pulses (signed)',
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
 * Converts BACKNXRawSignal to Excel row format matching template exactly
 */
function createDataRow(s: BACKNXRawSignal, idx: number): CellValue[] {
  const id = idx + 1;
  const b = s.bacnet;
  const k = s.knx;

  return [
    // Internal (BACnet Server)
    id, // #
    b.active ? 'True' : 'False', // Active
    b.description || '', // Description
    b.bacName, // Name
    formatBacType(b.type), // Type
    b.instance, // Instance
    formatBacUnits(b.units), // Units
    b.lut !== undefined && b.lut >= 0 ? b.lut : '-', // NC (Notification Class / LUT)
    '-', // Texts
    b.numOfStates !== undefined && b.numOfStates >= 0 ? b.numOfStates : '-', // # States
    b.relinquish !== undefined && b.relinquish >= 0 ? b.relinquish : '-', // Rel. Def.
    b.cov !== undefined && b.cov >= 0 ? b.cov : '-', // COV
    // External (KNX)
    id, // #
    formatDPTValue(k.dptValue), // DPT
    k.groupAddress, // Group Address
    k.additionalAddresses || '', // Additional Addresses
    formatFlag(k.flags.u, 'U'), // U
    formatFlag(k.flags.t, 'T'), // T
    formatFlag(k.flags.ri, 'Ri'), // Ri
    formatFlag(k.flags.w, 'W'), // W
    formatFlag(k.flags.r, 'R'), // R
    formatPriority(k.priority), // Priority
    // Extra
    '', // Conv. Id
    '-', // Conversions
  ];
}

/**
 * Converts BACKNXRawSignal objects to a flat RawWorkbook compatible with MAPS Excel format.
 */
export function rawBACKNXSignalsToWorkbook(
  signals: BACKNXRawSignal[],
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
