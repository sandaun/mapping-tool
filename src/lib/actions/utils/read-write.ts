/**
 * Utilities for determining read/write capabilities of signals
 * Centralizes the logic used across multiple actions
 */

export type ReadWriteCapabilities = {
  isReadable: boolean;
  isWritable: boolean;
};

/**
 * Determine read/write capabilities from mode field with fallback
 * Mode format: "R" (read), "W" (write), "R/W" (read-write)
 */
export function getReadWriteCapabilities(
  signal: { mode?: string },
  fallback: () => ReadWriteCapabilities
): ReadWriteCapabilities {
  if (signal.mode) {
    const mode = signal.mode.toUpperCase();
    return {
      isReadable: mode.includes('R'),
      isWritable: mode.includes('W'),
    };
  }
  return fallback();
}

/**
 * Determine read/write capabilities for Modbus signals based on registerType
 * Fallback when mode is not specified
 */
export function getModbusReadWriteFallback(
  registerType: string
): ReadWriteCapabilities {
  const isDiscreteInput = registerType === 'DiscreteInput';
  const isInputRegister = registerType === 'InputRegister';
  const isCoil = registerType === 'Coil';
  const isHoldingRegister = registerType === 'HoldingRegister';

  return {
    isReadable: isDiscreteInput || isInputRegister || isHoldingRegister,
    isWritable: isCoil || isHoldingRegister,
  };
}

/**
 * Determine read/write capabilities for BACnet objectType
 * INPUT (AI, BI, MI): read-only
 * OUTPUT (AO, BO, MO): write-only
 * VALUE (AV, BV, MV): read-write
 */
export function getBACnetReadWriteCapabilities(
  objectType: string
): ReadWriteCapabilities {
  const isInput = objectType.endsWith('I');
  const isOutput = objectType.endsWith('O');
  const isValue = objectType.endsWith('V');

  return {
    isReadable: isInput || isValue,
    isWritable: isOutput || isValue,
  };
}
