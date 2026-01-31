import type { DeviceSignal } from '@/lib/deviceSignals';

/**
 * Convert signals array to CSV format
 * Pure function with no side effects
 */
export const convertSignalsToCSV = (signals: DeviceSignal[]): string => {
  if (signals.length === 0) return '';

  const firstSignal = signals[0];

  if ('registerType' in firstSignal) {
    // Modbus
    const headers =
      'deviceId,signalName,registerType,address,dataType,units,description,mode,factor';
    const rows = signals.map((s) => {
      const sig = s as typeof firstSignal;
      return `${sig.deviceId},${sig.signalName},${sig.registerType},${sig.address},${sig.dataType},${sig.units || ''},${sig.description || ''},${sig.mode || ''},${sig.factor || ''}`;
    });
    return [headers, ...rows].join('\n');
  }

  if ('objectType' in firstSignal) {
    // BACnet
    const headers = 'deviceId,signalName,objectType,instance,units,description';
    const rows = signals.map((s) => {
      const sig = s as typeof firstSignal;
      return `${sig.deviceId},${sig.signalName},${sig.objectType},${sig.instance},${sig.units || ''},${sig.description || ''}`;
    });
    return [headers, ...rows].join('\n');
  }

  if ('groupAddress' in firstSignal) {
    // KNX
    const headers = 'signalName,groupAddress,dpt,description';
    const rows = signals.map((s) => {
      const sig = s as typeof firstSignal;
      return `${sig.signalName},${sig.groupAddress},${sig.dpt},${sig.description || ''}`;
    });
    return [headers, ...rows].join('\n');
  }

  return '';
};
