import { DetectedProtocol } from '../../types/signals';

const MODBUS_MARKERS = ['registertype', 'datatype', 'address'];
const BACNET_MARKERS = ['objecttype', 'instance'];
const KNX_MARKERS = ['groupaddress', 'dpt'];

/**
 * Detect the signal protocol from CSV text by analysing headers and content.
 * Returns the detected protocol or 'unknown' if it can't be determined.
 */
export function detectSignalProtocol(csvText: string): DetectedProtocol {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return 'unknown';

  const firstLine = lines[0].toLowerCase();

  // Check headers first
  const headers = firstLine.split(',').map((h) => h.trim());

  const hasModbus =
    MODBUS_MARKERS.filter((m) => headers.includes(m)).length >= 2;
  const hasBACnet =
    BACNET_MARKERS.filter((m) => headers.includes(m)).length >= 2;
  const hasKNX = KNX_MARKERS.filter((m) => headers.includes(m)).length >= 1;

  if (hasModbus) return 'modbus';
  if (hasBACnet) return 'bacnet';
  if (hasKNX) return 'knx';

  // Heuristic: check for ETS-style KNX format (no standard headers, GA pattern like "2/1/0")
  if (lines.length >= 2) {
    const sampleLine = lines[1];
    if (/\d+\/\d+\/\d+/.test(sampleLine) && /DPST|DPT/i.test(sampleLine)) {
      return 'knx';
    }
  }

  return 'unknown';
}

const PROTOCOL_LABELS: Record<DetectedProtocol, string> = {
  modbus: 'Modbus',
  bacnet: 'BACnet',
  knx: 'KNX',
  unknown: 'Unknown',
};

/**
 * Get a human‑readable label for a detected protocol.
 */
export function getProtocolLabel(protocol: DetectedProtocol): string {
  return PROTOCOL_LABELS[protocol];
}
