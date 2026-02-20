import type { DeviceSignal } from '@/lib/deviceSignals';

/**
 * Convert an array of DeviceSignal objects into a CSV string.
 *
 * The function inspects the first element to determine which protocol
 * (modbus / bacnet / knx) the array belongs to and produces the
 * appropriate headers + rows.
 *
 * Returns an empty string for empty arrays or unrecognised signal shapes.
 */
export function convertSignalsToCSV(signals: DeviceSignal[]): string {
  if (signals.length === 0) return '';

  const first = signals[0];

  if ('registerType' in first) {
    const headers =
      'deviceId,signalName,registerType,address,dataType,units,description,mode,factor';
    const rows = signals.map((s) => {
      const sig = s as typeof first;
      return `${sig.deviceId},${sig.signalName},${sig.registerType},${sig.address},${sig.dataType},${sig.units || ''},${sig.description || ''},${sig.mode || ''},${sig.factor || ''}`;
    });
    return [headers, ...rows].join('\n');
  }

  if ('objectType' in first) {
    const headers = 'deviceId,signalName,objectType,instance,units,description';
    const rows = signals.map((s) => {
      const sig = s as typeof first;
      return `${sig.deviceId},${sig.signalName},${sig.objectType},${sig.instance},${sig.units || ''},${sig.description || ''}`;
    });
    return [headers, ...rows].join('\n');
  }

  if ('groupAddress' in first) {
    const headers = 'signalName,groupAddress,dpt,description';
    const rows = signals.map((s) => {
      const sig = s as typeof first;
      return `${sig.signalName},${sig.groupAddress},${sig.dpt},${sig.description || ''}`;
    });
    return [headers, ...rows].join('\n');
  }

  return '';
}
