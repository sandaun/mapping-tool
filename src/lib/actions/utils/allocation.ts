import type { DeviceSignal } from '../../deviceSignals';

export type AllocationPolicy = 'simple'; // Futur: 'grouped-by-device', 'offset-by-type', etc.

/**
 * Allocate Modbus addresses with simple sequential policy.
 * Returns map: signalId -> address
 */
export function allocateModbusAddresses(
  signals: DeviceSignal[],
  policy: AllocationPolicy = 'simple'
): Map<string, number> {
  const allocation = new Map<string, number>();

  if (policy === 'simple') {
    let holdingAddress = 0;

    for (const sig of signals) {
      const signalId = `${sig.deviceId}_${sig.signalName}`;

      // Tots els objectes BACnet → HoldingRegister (16 o 32 bits)
      if ('objectType' in sig) {
        allocation.set(signalId, holdingAddress++);
      }
    }
  }

  return allocation;
}

/**
 * Allocate BACnet instances with simple sequential policy.
 * Returns map: signalId -> instance
 */
export function allocateBACnetInstances(
  signals: DeviceSignal[],
  policy: AllocationPolicy = 'simple'
): Map<string, number> {
  const allocation = new Map<string, number>();

  if (policy === 'simple') {
    let instance = 1;

    for (const sig of signals) {
      const signalId = `${sig.deviceId}_${sig.signalName}`;
      allocation.set(signalId, instance++);
    }
  }

  return allocation;
}
