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

export type DeviceSignal = ModbusSignal | BACnetSignal;

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

// CSV Parser
export function parseDeviceSignalsCSV(
  csvText: string,
  gatewayType: 'bacnet-server__modbus-master' | 'modbus-slave__bacnet-client'
): ParseResult {
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

  if (gatewayType === 'bacnet-server__modbus-master') {
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
      const description = descriptionIdx >= 0 ? cols[descriptionIdx] : undefined;

      if (!deviceId || !signalName || !registerType || !addressRaw || !dataType) {
        warnings.push(
          `Fila ${i + 2}: camps obligatoris buits (deviceId, signalName, registerType, address, dataType).`
        );
        continue;
      }

      const address = parseInt(addressRaw, 10);
      if (isNaN(address)) {
        warnings.push(`Fila ${i + 2}: address "${addressRaw}" no és un número.`);
        continue;
      }

      signals.push({
        deviceId,
        signalName,
        registerType,
        address,
        dataType,
        units,
        description,
      } as ModbusSignal);
    }
  } else if (gatewayType === 'modbus-slave__bacnet-client') {
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
      const description = descriptionIdx >= 0 ? cols[descriptionIdx] : undefined;

      if (!deviceId || !signalName || !objectType || !instanceRaw) {
        warnings.push(
          `Fila ${i + 2}: camps obligatoris buits (deviceId, signalName, objectType, instance).`
        );
        continue;
      }

      const instance = parseInt(instanceRaw, 10);
      if (isNaN(instance)) {
        warnings.push(`Fila ${i + 2}: instance "${instanceRaw}" no és un número.`);
        continue;
      }

      signals.push({
        deviceId,
        signalName,
        objectType,
        instance,
        units,
        description,
      } as BACnetSignal);
    }
  }

  if (signals.length === 0 && warnings.length === 0) {
    warnings.push('No s\'han pogut parsejar senyals.');
  }

  return { signals, warnings };
}
