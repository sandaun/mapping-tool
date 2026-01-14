/**
 * KNX Data Point Types (DPTs) with official names
 * Source: KNX Standard "Datapoint Types v02.02.01"
 */

export interface KNXDataPointType {
  dpt: string;
  name: string;
}

/**
 * Complete list of KNX DPTs
 * Format: "DPT: name" (e.g., "1.001: switch")
 */
export const KNX_DPT_LIST: KNXDataPointType[] = [
  { dpt: '1.001', name: 'switch' },
  { dpt: '1.002', name: 'boolean' },
  { dpt: '1.003', name: 'enable' },
  { dpt: '1.004', name: 'ramp' },
  { dpt: '1.005', name: 'alarm' },
  { dpt: '1.006', name: 'binary value' },
  { dpt: '1.007', name: 'step' },
  { dpt: '1.008', name: 'up/down' },
  { dpt: '1.009', name: 'open/close' },
  { dpt: '1.010', name: 'start/stop' },
  { dpt: '1.011', name: 'state' },
  { dpt: '1.012', name: 'invert' },
  { dpt: '1.013', name: 'dim send style' },
  { dpt: '1.014', name: 'input source' },
  { dpt: '1.015', name: 'reset' },
  { dpt: '1.018', name: 'occupancy' },
  { dpt: '1.019', name: 'window/door' },
  { dpt: '1.021', name: 'logical function' },
  { dpt: '1.022', name: 'scene' },
  { dpt: '1.100', name: 'cooling/heating' },
  { dpt: '4.001', name: 'character (ASCII)' },
  { dpt: '4.002', name: 'character (ISO 8859-1)' },
  { dpt: '5.001', name: 'percentage (0..100%)' },
  { dpt: '5.003', name: 'angle (degrees)' },
  { dpt: '5.004', name: 'percentage (0..255%)' },
  { dpt: '5.006', name: 'tariff (0..255)' },
  { dpt: '5.010', name: 'counter pulses (0..255)' },
  { dpt: '6.001', name: 'percentage (-128..127%)' },
  { dpt: '6.010', name: 'counter pulses (-128..127)' },
  { dpt: '7.001', name: 'pulses' },
  { dpt: '7.002', name: 'time (10 ms)' },
  { dpt: '7.005', name: 'time (s)' },
  { dpt: '7.006', name: 'time (min)' },
  { dpt: '7.007', name: 'time (h)' },
  { dpt: '7.011', name: 'length (mm)' },
  { dpt: '7.012', name: 'current (mA)' },
  { dpt: '7.013', name: 'brightness (lux)' },
  { dpt: '8.001', name: 'pulses difference' },
  { dpt: '8.002', name: 'time lag (ms)' },
  { dpt: '8.005', name: 'time lag (s)' },
  { dpt: '8.006', name: 'time lag (min)' },
  { dpt: '8.007', name: 'time lag (h)' },
  { dpt: '8.010', name: 'percentage difference (%)' },
  { dpt: '8.011', name: 'rotation angle (°)' },
  { dpt: '9.001', name: 'temperature (°C)' },
  { dpt: '9.002', name: 'temperature difference (°K)' },
  { dpt: '9.003', name: 'kelvin/hour (°K/h)' },
  { dpt: '9.004', name: 'lux (Lux)' },
  { dpt: '9.005', name: 'speed (m/s)' },
  { dpt: '9.006', name: 'pressure (Pa)' },
  { dpt: '9.007', name: 'percentage (%)' },
  { dpt: '9.008', name: 'parts/million (ppm)' },
  { dpt: '9.010', name: 'time (s)' },
  { dpt: '9.011', name: 'time (ms)' },
  { dpt: '9.020', name: 'voltage (mV)' },
  { dpt: '9.021', name: 'current (mA)' },
  { dpt: '9.022', name: 'power density (W/m2)' },
  { dpt: '9.023', name: 'kelvin/percent (K/%)' },
  { dpt: '9.024', name: 'power (kW)' },
  { dpt: '9.025', name: 'volume flow (l/h)' },
  { dpt: '9.026', name: 'rain amount (l/m2)' },
  { dpt: '9.027', name: 'temperature (°F)' },
  { dpt: '9.028', name: 'wind speed (km/h)' },
  { dpt: '12.001', name: 'counter pulses (unsigned)' },
  { dpt: '13.001', name: 'counter pulses (signed)' },
  { dpt: '13.002', name: 'flow rate (m3/h)' },
  { dpt: '13.010', name: 'active energy (Wh)' },
  { dpt: '13.011', name: 'apparent energy (VAh)' },
  { dpt: '13.012', name: 'reactive energy (VARh)' },
  { dpt: '13.013', name: 'active energy (kWh)' },
  { dpt: '13.014', name: 'apparent energy (kVAh)' },
  { dpt: '13.015', name: 'reactive energy (kVARh)' },
  { dpt: '13.100', name: 'time lag (s)' },
  { dpt: '20.102', name: 'HVAC mode' },
  { dpt: '20.105', name: 'HVAC ContrMode' },
];

/**
 * DPT lookup map for fast access
 */
const DPT_MAP = new Map<string, string>(
  KNX_DPT_LIST.map((item) => [item.dpt, item.name])
);

/**
 * Format a DPT code with its official name
 * @param dpt - DPT code (e.g., "1.001", "9.024")
 * @returns Formatted string "DPT: name" (e.g., "1.001: switch")
 */
export function formatDPT(dpt: string): string {
  const name = DPT_MAP.get(dpt);
  if (name) return `${dpt}: ${name}`;

  // Fallback for unknown 2.x and 3.x DPTs
  const main = dpt.split('.')[0];
  if (main === '2') return `2.x: (2-bit. 1 bit controlled)`;
  if (main === '3') return `3.x: (4-bit. 3-bit controlled)`;

  return dpt;
}

/**
 * Get DPT name only
 * @param dpt - DPT code
 * @returns DPT name or undefined if not found
 */
export function getDPTName(dpt: string): string | undefined {
  return DPT_MAP.get(dpt);
}
