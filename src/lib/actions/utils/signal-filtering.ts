import type {
  DeviceSignal,
  ModbusSignal,
  BACnetSignal,
  KNXSignal,
} from '@/lib/deviceSignals';
import {
  isModbusSignal,
  isBACnetSignal,
  isKNXSignal,
} from '@/lib/deviceSignals';

/**
 * Filter Modbus signals with type safety (NO 'as' type assertions)
 * Uses type guard from deviceSignals module
 */
export function filterModbusSignals(signals: DeviceSignal[]): ModbusSignal[] {
  return signals.filter(isModbusSignal);
}

/**
 * Filter BACnet signals with type safety (NO 'as' type assertions)
 * Uses type guard from deviceSignals module
 */
export function filterBACnetSignals(signals: DeviceSignal[]): BACnetSignal[] {
  return signals.filter(isBACnetSignal);
}

/**
 * Filter KNX signals with type safety (NO 'as' type assertions)
 * Uses type guard from deviceSignals module
 */
export function filterKNXSignals(signals: DeviceSignal[]): KNXSignal[] {
  return signals.filter(isKNXSignal);
}
