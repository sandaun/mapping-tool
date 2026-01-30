/**
 * Constants for signal generation actions
 * Centralizes all magic strings and values used across actions
 */

/**
 * Warning and error messages
 */
export const WARNINGS = {
  SIGNALS_SHEET_NOT_FOUND: "No s'ha trobat el sheet 'Signals'.",
  NO_KNX_SIGNALS: 'No hi ha signals KNX per processar.',
} as const;

/**
 * Standard Excel column values
 */
export const EXCEL_VALUES = {
  // Common values
  ACTIVE_TRUE: 'True',
  EMPTY_BACNET: '-', // BACnet empty fields (NC, COV, Rel. Def., etc.)
  EMPTY_KNX: '', // KNX empty fields (Additional Addresses, flags, Conv. Id, etc.)
  EMPTY_MODBUS: '-', // Modbus empty fields (Bit, # Bits, Conv. Id, Conversions)

  // Modbus specific
  BASE_ZERO: '0-based',
  BASE_ONE: '1-based',
  BYTE_ORDER_BIG_ENDIAN: '0: Big Endian',
  DEFAULT_DEADBAND: '0',

  // KNX specific
  DEFAULT_PRIORITY: '3: Normal',
} as const;

/**
 * Device name templates
 */
export const DEVICE_TEMPLATES = {
  RTU_PORT_A: (deviceNum: number) => `RTU // Port A // Device ${deviceNum}`,
  RTU_PORT_B: (deviceNum: number) => `RTU // Port B // Device ${deviceNum}`,
  DEVICE: (deviceNum: number) => `Device ${deviceNum}`,
} as const;

/**
 * Common column names used across Excel sheets
 * This helps avoid typos and makes it easier to refactor
 */
export const COLUMN_NAMES = {
  // Common columns
  HASH: '#',
  ACTIVE: 'Active',
  DESCRIPTION: 'Description',
  NAME: 'Name',

  // BACnet columns
  TYPE: 'Type',
  INSTANCE: 'Instance',
  UNITS: 'Units',
  NC: 'NC',
  TEXTS: 'Texts',
  NUM_STATES: '# States',
  REL_DEF: 'Rel. Def.',
  COV: 'COV',

  // Modbus columns
  DEVICE: 'Device',
  NUM_SLAVE: '# Slave',
  BASE: 'Base',
  READ_FUNC: 'Read Func',
  WRITE_FUNC: 'Write Func',
  DATA_LENGTH: 'Data Length',
  FORMAT: 'Format',
  BYTE_ORDER: 'ByteOrder',
  ADDRESS: 'Address',
  BIT: 'Bit',
  NUM_BITS: '# Bits',
  DEADBAND: 'Deadband',
  CONV_ID: 'Conv. Id',
  CONVERSIONS: 'Conversions',

  // KNX columns
  DPT: 'DPT',
  GROUP_ADDRESS: 'Group Address',
  ADDITIONAL_ADDRESSES: 'Additional Addresses',
  U: 'U',
  T: 'T',
  RI: 'Ri',
  W: 'W',
  R: 'R',
  PRIORITY: 'Priority',

  // Modbus Slave specific
  READ_WRITE: 'Read / Write',
  STRING_LENGTH: 'String Length',

  // BACnet Client specific
  DEVICE_NAME: 'Device Name',
} as const;
