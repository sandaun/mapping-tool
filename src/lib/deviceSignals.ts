// Types for device signals (imported from external sources)

export type ModbusSignal = {
  deviceId: string;
  signalName: string;
  registerType: string; // HoldingRegister, InputRegister, Coil, DiscreteInput
  address: number;
  dataType: string; // Int16, Float32, Uint16, etc.
  units?: string;
  description?: string;
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
    | 'bacnet-server__knx'
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
      warnings: ['El CSV està buit o només té capçaleres.'],
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
      warnings.push(
        `Falten columnes obligatòries per Modbus: ${missing.join(', ')}`
      );
      return { signals: [], warnings };
    }

    const deviceIdIdx = headers.indexOf('deviceId');
    const signalNameIdx = headers.indexOf('signalName');
    const registerTypeIdx = headers.indexOf('registerType');
    const addressIdx = headers.indexOf('address');
    const dataTypeIdx = headers.indexOf('dataType');
    const unitsIdx = headers.indexOf('units');
    const descriptionIdx = headers.indexOf('description');

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.trim());

      const deviceId = cols[deviceIdIdx];
      const signalName = cols[signalNameIdx];
      const registerType = cols[registerTypeIdx];
      const addressRaw = cols[addressIdx];
      const dataType = cols[dataTypeIdx];
      const units = unitsIdx >= 0 ? cols[unitsIdx] : undefined;
      const description =
        descriptionIdx >= 0 ? cols[descriptionIdx] : undefined;

      if (
        !deviceId ||
        !signalName ||
        !registerType ||
        !addressRaw ||
        !dataType
      ) {
        warnings.push(
          `Fila ${
            i + 2
          }: camps obligatoris buits (deviceId, signalName, registerType, address, dataType).`
        );
        continue;
      }

      const address = parseInt(addressRaw, 10);
      if (isNaN(address)) {
        warnings.push(
          `Fila ${i + 2}: address "${addressRaw}" no és un número.`
        );
        continue;
      }

      const signal: ModbusSignal = {
        deviceId,
        signalName,
        registerType,
        address,
        dataType,
        units,
        description,
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
      warnings.push(
        `Falten columnes obligatòries per BACnet: ${missing.join(', ')}`
      );
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
          `Fila ${
            i + 2
          }: camps obligatoris buits (deviceId, signalName, objectType, instance).`
        );
        continue;
      }

      const instance = parseInt(instanceRaw, 10);
      if (isNaN(instance)) {
        warnings.push(
          `Fila ${i + 2}: instance "${instanceRaw}" no és un número.`
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
    warnings.push("No s'han pogut parsejar senyals.");
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
        `Signal "${signalName}" no té DPT vàlid (${dptRaw}), s'omet.`
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
      "No s'han trobat signals vàlids al CSV d'ETS. Verifica el format."
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
