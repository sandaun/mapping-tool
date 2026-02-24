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

export type DetectedProtocol = 'modbus' | 'bacnet' | 'knx' | 'unknown';

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
