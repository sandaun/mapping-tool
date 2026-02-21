// Types for device signals (imported from external sources)

export type ModbusSignal = {
  deviceId: string;
  signalName: string;
  registerType: string; // HoldingRegister, InputRegister, Coil, DiscreteInput
  address: number;
  dataType: string; // Int16, Float32, Uint16, etc.
  units?: string;
  description?: string;
  mode?: string; // R (read-only), W (write-only), R/W (read-write)
  factor?: number; // Scaling factor (e.g., 10, 100, 1000)
};

export type BACnetSignal = {
  deviceId: string;
  signalName: string;
  objectType: string; // AI, AO, AV, BI, BO, BV, MSI, MSO, MSV
  instance: number;
  units?: string;
  description?: string;
};

export type KNXSignal = {
  signalName: string; // Signal description from ETS
  groupAddress: string; // KNX Group Address (e.g., "2/1/0")
  dpt: string; // Data Point Type (e.g., "1.001", "9.001")
  description?: string; // Optional full hierarchy path
};

export type DeviceSignal = ModbusSignal | BACnetSignal | KNXSignal;

export type ParseResult = {
  signals: DeviceSignal[];
  warnings: string[];
};

// ---------------------------------------------------------------------------
// Protocol detection from CSV headers
// ---------------------------------------------------------------------------

export type DetectedProtocol = 'modbus' | 'bacnet' | 'knx' | 'unknown';

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

function normalizeModbusRegisterType(raw: string): string {
  const value = raw.trim().toLowerCase();

  if (value.includes('coil')) return 'Coil';
  if (value.includes('discrete')) return 'DiscreteInput';
  if (value.includes('input') || value.includes('fc04') || value === '4') {
    return 'InputRegister';
  }
  if (value.includes('holding') || value.includes('fc03') || value === '3') {
    return 'HoldingRegister';
  }

  return raw.trim();
}

function normalizeModbusDataType(raw: string): string {
  const value = raw.trim();
  const lower = value.toLowerCase();

  // Software does not support 8-bit data length, normalize to 16-bit.
  if (lower === 's8') return 'Int16';
  if (lower === 'u8') return 'Uint16';
  if (lower === 's16') return 'Int16';
  if (lower === 'u16') return 'Uint16';
  if (lower === 's32') return 'Int32';
  if (lower === 'u32') return 'Uint32';
  if (lower === 'f32') return 'Float32';

  return value;
}

// Type guards
export function isModbusSignal(signal: DeviceSignal): signal is ModbusSignal {
  return 'registerType' in signal && 'address' in signal;
}

export function isBACnetSignal(signal: DeviceSignal): signal is BACnetSignal {
  return 'objectType' in signal && 'instance' in signal;
}

export function isKNXSignal(signal: DeviceSignal): signal is KNXSignal {
  return 'groupAddress' in signal && 'dpt' in signal;
}

// CSV Parser
export function parseDeviceSignalsCSV(
  csvText: string,
  gatewayType:
    | 'bacnet-server__modbus-master'
    | 'modbus-slave__bacnet-client'
    | 'knx__modbus-master'
    | 'knx__bacnet-client'
    | 'modbus-slave__knx'
    | 'bacnet-server__knx',
): ParseResult {
  // Special handling for ETS CSV format (modbus-slave__knx and bacnet-server__knx)
  if (
    gatewayType === 'modbus-slave__knx' ||
    gatewayType === 'bacnet-server__knx'
  ) {
    return parseETSCSVFormat(csvText);
  }

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return {
      signals: [],
      warnings: ['CSV is empty or contains only headers.'],
    };
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim());
  const dataLines = lines.slice(1);

  const signals: DeviceSignal[] = [];
  const warnings: string[] = [];

  if (
    gatewayType === 'bacnet-server__modbus-master' ||
    gatewayType === 'knx__modbus-master'
  ) {
    // Espera: deviceId,signalName,registerType,address,dataType,units,description
    const requiredCols = [
      'deviceId',
      'signalName',
      'registerType',
      'address',
      'dataType',
    ];
    const missing = requiredCols.filter((col) => !headers.includes(col));
    if (missing.length > 0) {
      warnings.push(`Missing required Modbus columns: ${missing.join(', ')}`);
      return { signals: [], warnings };
    }

    const deviceIdIdx = headers.indexOf('deviceId');
    const signalNameIdx = headers.indexOf('signalName');
    const registerTypeIdx = headers.indexOf('registerType');
    const addressIdx = headers.indexOf('address');
    const dataTypeIdx = headers.indexOf('dataType');
    const unitsIdx = headers.indexOf('units');
    const descriptionIdx = headers.indexOf('description');
    const modeIdx = headers.indexOf('mode'); // Optional
    const factorIdx = headers.indexOf('factor'); // Optional

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.trim());

      const deviceId = cols[deviceIdIdx];
      const signalName = cols[signalNameIdx];
      const registerTypeRaw = cols[registerTypeIdx];
      const addressRaw = cols[addressIdx];
      const dataTypeRaw = cols[dataTypeIdx];
      const units = unitsIdx >= 0 ? cols[unitsIdx] : undefined;
      const description =
        descriptionIdx >= 0 ? cols[descriptionIdx] : undefined;
      const mode = modeIdx >= 0 ? cols[modeIdx] : undefined;
      const factorRaw = factorIdx >= 0 ? cols[factorIdx] : undefined;

      if (
        !deviceId ||
        !signalName ||
        !registerTypeRaw ||
        !addressRaw ||
        !dataTypeRaw
      ) {
        warnings.push(
          `Row ${
            i + 2
          }: required fields are empty (deviceId, signalName, registerType, address, dataType).`,
        );
        continue;
      }

      const address = parseInt(addressRaw, 10);
      if (isNaN(address)) {
        warnings.push(
          `Row ${i + 2}: address "${addressRaw}" is not a valid number.`,
        );
        continue;
      }

      // Parse optional factor
      const factor =
        factorRaw && factorRaw.trim() !== ''
          ? parseFloat(factorRaw)
          : undefined;

      const signal: ModbusSignal = {
        deviceId,
        signalName,
        registerType: normalizeModbusRegisterType(registerTypeRaw),
        address,
        dataType: normalizeModbusDataType(dataTypeRaw),
        units,
        description,
        mode: mode && mode.trim() !== '' ? mode.trim() : undefined,
        factor: factor && !isNaN(factor) ? factor : undefined,
      };
      signals.push(signal);
    }
  } else if (
    gatewayType === 'modbus-slave__bacnet-client' ||
    gatewayType === 'knx__bacnet-client' ||
    gatewayType === 'bacnet-server__knx'
  ) {
    // Espera: deviceId,signalName,objectType,instance,units,description
    const requiredCols = ['deviceId', 'signalName', 'objectType', 'instance'];
    const missing = requiredCols.filter((col) => !headers.includes(col));
    if (missing.length > 0) {
      warnings.push(`Missing required BACnet columns: ${missing.join(', ')}`);
      return { signals: [], warnings };
    }

    const deviceIdIdx = headers.indexOf('deviceId');
    const signalNameIdx = headers.indexOf('signalName');
    const objectTypeIdx = headers.indexOf('objectType');
    const instanceIdx = headers.indexOf('instance');
    const unitsIdx = headers.indexOf('units');
    const descriptionIdx = headers.indexOf('description');

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.trim());

      const deviceId = cols[deviceIdIdx];
      const signalName = cols[signalNameIdx];
      const objectType = cols[objectTypeIdx];
      const instanceRaw = cols[instanceIdx];
      const units = unitsIdx >= 0 ? cols[unitsIdx] : undefined;
      const description =
        descriptionIdx >= 0 ? cols[descriptionIdx] : undefined;

      if (!deviceId || !signalName || !objectType || !instanceRaw) {
        warnings.push(
          `Row ${
            i + 2
          }: required fields are empty (deviceId, signalName, objectType, instance).`,
        );
        continue;
      }

      const instance = parseInt(instanceRaw, 10);
      if (isNaN(instance)) {
        warnings.push(
          `Row ${i + 2}: instance "${instanceRaw}" is not a valid number.`,
        );
        continue;
      }

      const signal: BACnetSignal = {
        deviceId,
        signalName,
        objectType,
        instance,
        units,
        description,
      };
      signals.push(signal);
    }
  }

  if (signals.length === 0 && warnings.length === 0) {
    warnings.push('No signals could be parsed from the input.');
  }

  return { signals, warnings };
}

/**
 * Parse ETS CSV export format
 * Format: "Level1, Level2, Level3, GroupAddress, ..., DPT, ..."
 */
function parseETSCSVFormat(csvText: string): ParseResult {
  const signals: KNXSignal[] = [];
  const warnings: string[] = [];
  const lines = csvText.trim().split('\n');

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Remove outer quotes if present
    let cleanLine = line.trim();
    if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
      cleanLine = cleanLine.slice(1, -1);
    }

    // Split by comma
    const fields = cleanLine.split(',').map((f) => f.trim());

    // ETS format: col 2 = signal name, col 3 = GA, col 7 = DPT
    const signalName = cleanField(fields[2]);
    const groupAddress = cleanField(fields[3]);
    const dptRaw = cleanField(fields[7]);

    // Skip if not a signal line (no name or GA is incomplete like "2/-/-")
    if (!signalName || !groupAddress || groupAddress.includes('/-/')) {
      continue;
    }

    // Normalize DPT format
    const dpt = normalizeDPT(dptRaw);
    if (!dpt) {
      warnings.push(
        `Signal "${signalName}" has no valid DPT (${dptRaw}), skipped.`,
      );
      continue;
    }

    signals.push({
      signalName,
      groupAddress,
      dpt,
    });
  }

  if (signals.length === 0) {
    warnings.push(
      'No valid signals found in the ETS CSV. Please verify the format.',
    );
  }

  return { signals, warnings };
}

/**
 * Clean field: remove all quotes and trim
 */
function cleanField(field: string | undefined): string {
  if (!field) return '';
  return field.replace(/["']/g, '').trim();
}

/**
 * Normalize DPT format from ETS to standard format
 * "DPST-1-1" → "1.001"
 * "DPT-7" → "7.001"
 */
function normalizeDPT(dptRaw: string): string {
  if (!dptRaw) return '';

  // Match "DPST-X-Y"
  const matchDPST = dptRaw.match(/DPST-(\d+)-(\d+)/i);
  if (matchDPST) {
    const main = matchDPST[1];
    const sub = matchDPST[2].padStart(3, '0');
    return `${main}.${sub}`;
  }

  // Match "DPT-X"
  const matchDPT = dptRaw.match(/DPT-(\d+)/i);
  if (matchDPT) {
    return `${matchDPT[1]}.001`;
  }

  // Already in correct format "9.001"
  if (/^\d+\.\d+$/.test(dptRaw)) {
    return dptRaw;
  }

  return '';
}
