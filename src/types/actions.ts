import type { RawWorkbook } from '@/lib/excel/raw';

/**
 * Result type returned by all signal generation actions
 */
export type GenerateSignalsResult = {
  updatedWorkbook: RawWorkbook;
  rowsAdded: number;
  warnings: string[];
};

/**
 * Allocation policy for BACnet instances and Modbus addresses
 */
export type AllocationPolicy = 'simple' | 'grouped';

/**
 * Policy for Modbus address generation
 */
export type ModbusGenerationPolicy = {
  startAddress?: number;
};

/**
 * Policy for KNX signal generation
 */
export type KNXGenerationPolicy = {
  startGroupAddress?: string;
  deviceNumber?: number;
  slaveId?: number;
  deviceName?: string;
};

/**
 * Policy for BACnet signal generation
 */
export type BACnetGenerationPolicy = {
  startInstance?: number;
  policy?: AllocationPolicy;
};
