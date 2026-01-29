import type { TemplateId } from '@/types/page.types';

/**
 * Defines which columns to display in the editable table for each gateway type.
 * These are the meaningful signal columns, excluding internal metadata like #, Active, etc.
 */
export const EDITABLE_COLUMNS: Record<TemplateId, string[]> = {
  // BACnet Server ← Modbus Master
  'bacnet-server__modbus-master': [
    '#',
    // BACnet Server columns
    'Name',
    'Type',
    'Instance',
    'Units',
    'COV',
    // Modbus Master columns
    'Device',
    '# Slave',
    'Address',
    'Data Length',
    'Format',
    'ByteOrder',
  ],

  // Modbus Slave ← BACnet Client
  'modbus-slave__bacnet-client': [
    '#',
    // Modbus Slave columns
    'Name',
    'Address',
    'Data Length',
    'Format',
    'Read / Write',
    // BACnet Client columns
    'Device Name',
    'Type',
    'Instance',
  ],

  // KNX ← Modbus Master
  'knx__modbus-master': [
    '#',
    // KNX columns
    'Name',
    'Group Address',
    'DPT',
    'Priority',
    // Modbus Master columns
    'Device',
    '# Slave',
    'Address',
    'Data Length',
    'Format',
  ],

  // KNX ← BACnet Client
  'knx__bacnet-client': [
    '#',
    // KNX columns
    'Name',
    'Group Address',
    'DPT',
    'Priority',
    // BACnet Client columns
    'Device Name',
    'Type',
    'Instance',
  ],

  // Modbus Slave ← KNX
  'modbus-slave__knx': [
    '#',
    // Modbus Slave columns
    'Name',
    'Address',
    'Data Length',
    'Format',
    'Read / Write',
    // KNX columns
    'Group Address',
    'DPT',
  ],

  // BACnet Server ← KNX
  'bacnet-server__knx': [
    '#',
    // BACnet Server columns
    'Name',
    'Type',
    'Instance',
    'Units',
    'COV',
    // KNX columns
    'Group Address',
    'DPT',
  ],
};
