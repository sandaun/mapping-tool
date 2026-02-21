import { XMLParser } from 'fast-xml-parser';
import type { MBSBACRawSignal, ModbusSlaveConfig, BACnetClientConfig, BACnetClientDevice } from '../types';

/**
 * Parse results for Modbus Slave ← BACnet Client ibmaps files
 */
export type ParseMBSBACResult = {
  signals: MBSBACRawSignal[];
  devices: BACnetClientDevice[];
  warnings: string[];
};

type XmlRecord = Record<string, unknown>;

// -----------------------------------------------------
// Helper functions
// -----------------------------------------------------
const asRecord = (value: unknown): XmlRecord =>
  typeof value === 'object' && value !== null ? (value as XmlRecord) : {};

const toStringValue = (value: unknown): string =>
  value === null || value === undefined ? '' : String(value);

const toNumberValue = (value: unknown, fallback = -1): number => {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

const toBoolean = (value: unknown): boolean =>
  toStringValue(value) === 'True';

const toStringRecord = (record: XmlRecord): Record<string, string> =>
  Object.fromEntries(
    Object.entries(record).map(([key, val]) => [key, toStringValue(val)]),
  );

// -----------------------------------------------------
// Extract BACnet Client Devices from ExternalProtocol
// -----------------------------------------------------
function extractBACnetDevices(externalProtocol: XmlRecord): Map<number, BACnetClientDevice> {
  const bacDevicesRaw = asRecord(externalProtocol).BACnetDevices;
  const deviceRaw = asRecord(bacDevicesRaw).BACnetDevice;
  const devices = Array.isArray(deviceRaw)
    ? deviceRaw
    : deviceRaw
      ? [deviceRaw]
      : [];

  const deviceMap = new Map<number, BACnetClientDevice>();
  for (const dev of devices) {
    const devRecord = dev as XmlRecord;
    const index = toNumberValue(devRecord['@_Index'], -1);
    deviceMap.set(index, {
      index,
      name: toStringValue(devRecord['@_Name']),
      enabled: toBoolean(devRecord['@_Enabled']),
      ip: toStringValue(devRecord['@_Ip']),
      port: toNumberValue(devRecord['@_Port'], 47808),
      objInstance: toNumberValue(devRecord['@_ObjInstance'], 0),
    });
  }

  return deviceMap;
}

// -----------------------------------------------------
// Extract BACnet Client Objects from ExternalProtocol
// -----------------------------------------------------
function extractBACnetObjects(externalProtocol: XmlRecord): Map<number, XmlRecord> {
  const objectsRaw = asRecord(asRecord(externalProtocol).Objects).Object;
  const objects = Array.isArray(objectsRaw)
    ? objectsRaw
    : objectsRaw
      ? [objectsRaw]
      : [];

  const objectMap = new Map<number, XmlRecord>();
  for (const obj of objects) {
    const objRecord = obj as XmlRecord;
    const idxExternal = toNumberValue(objRecord.idxExternal, -1);
    objectMap.set(idxExternal, objRecord);
  }

  return objectMap;
}

// -----------------------------------------------------
// Build ModbusSlaveConfig from Signal record
// -----------------------------------------------------
function buildModbusSlaveConfig(sigRecord: XmlRecord): ModbusSlaveConfig {
  const description = toStringValue(sigRecord.Description);
  const isEnabled = toBoolean(sigRecord.isEnabled);
  const dataLength = toNumberValue(sigRecord.LenBits, 16);
  const format = toNumberValue(sigRecord.Format, 0);
  const address = toNumberValue(sigRecord.Address, 0);
  const bit = toNumberValue(sigRecord.Bit, -1);
  const readWrite = toNumberValue(sigRecord.ReadWrite, 0);
  const stringLength = toNumberValue(sigRecord.StringLength, -1);

  // Virtual config
  const virtualRecord = asRecord(sigRecord.Virtual);
  const isVirtual = toBoolean(virtualRecord['@_Status']);

  // Extract remaining attrs for preservation
  const knownFields = new Set([
    'isEnabled', 'idxConfig', 'idxExternal', 'IdxOperations', 'IdxFilters',
    'Description', 'LenBits', 'Format', 'Bit', 'Address', 'ReadWrite',
    'StringLength', 'SlaveIndex', 'GatewayIndex', 'Virtual', 'ProtocolIndex', '@_ID',
  ]);
  const sigRest = Object.fromEntries(
    Object.entries(sigRecord).filter(([k]) => !knownFields.has(k)),
  );

  return {
    description,
    dataLength,
    format,
    address,
    bit,
    readWrite,
    stringLength,
    isEnabled,
    virtual: isVirtual,
    fixed: isVirtual ? toBoolean(virtualRecord['@_Fixed']) : undefined,
    extraAttrs: toStringRecord(sigRest),
  };
}

// -----------------------------------------------------
// Build BACnetClientConfig from Object record
// -----------------------------------------------------
function buildBacnetClientConfig(
  objRecord: XmlRecord,
  deviceMap: Map<number, BACnetClientDevice>,
): BACnetClientConfig {
  const deviceIndex = toNumberValue(objRecord.DeviceIndex, 0);
  const device = deviceMap.get(deviceIndex);
  const deviceName = device?.name || `Device ${deviceIndex}`;

  const bacType = toNumberValue(objRecord.BACType, 0);
  const bacInstance = toNumberValue(objRecord.BACInstance, 0);
  const objectId = toNumberValue(objRecord.ObjectID, 0);
  const active = toBoolean(objRecord.Active);

  // Virtual
  const virtualRecord = asRecord(objRecord.Virtual);
  const isVirtual = toBoolean(virtualRecord['@_Status']);

  // Extract remaining attrs for preservation
  const knownFields = new Set([
    'idxConfig', 'idxExternal', 'IdxOperations', 'IdxFilters',
    'BACType', 'BACInstance', 'ObjectID', 'DeviceIndex', 'Param',
    'Active', 'Virtual', '@_ID',
  ]);
  const objRest = Object.fromEntries(
    Object.entries(objRecord).filter(([k]) => !knownFields.has(k)),
  );

  return {
    deviceIndex,
    deviceName,
    bacType,
    bacInstance,
    objectId,
    active,
    virtual: isVirtual,
    fixed: isVirtual ? toBoolean(virtualRecord['@_Fixed']) : undefined,
    extraAttrs: toStringRecord(objRest),
  };
}

// -----------------------------------------------------
// Main parser
// -----------------------------------------------------
/**
 * Parses an IN-MBS-BAC.ibmaps XML content into MBSBACRawSignal model.
 */
export function parseIbmapsSignals_MBS_BAC(
  xmlContent: string,
): ParseMBSBACResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (_name: string, jpath: string) => {
      if (jpath.endsWith('InternalProtocol.Signals.Signal')) return true;
      if (jpath.endsWith('ExternalProtocol.Objects.Object')) return true;
      if (jpath.endsWith('ExternalProtocol.BACnetDevices.BACnetDevice')) return true;
      return false;
    },
  });

  const parsed = parser.parse(xmlContent);
  const project = parsed.Project as XmlRecord | undefined;
  const warnings: string[] = [];

  if (!project) {
    throw new Error('Invalid XML: Root <Project> element not found.');
  }

  // 1. Extract BACnet Client Devices and Objects from ExternalProtocol
  const externalProtocol = asRecord(project).ExternalProtocol;
  const deviceMap = extractBACnetDevices(asRecord(externalProtocol));
  const objectMap = extractBACnetObjects(asRecord(externalProtocol));

  // 2. Extract Modbus Slave Signals from InternalProtocol
  const internalProtocol = asRecord(project).InternalProtocol;
  const xmlSignalsRaw = asRecord(asRecord(internalProtocol).Signals).Signal;
  const xmlSignals = Array.isArray(xmlSignalsRaw)
    ? xmlSignalsRaw
    : xmlSignalsRaw
      ? [xmlSignalsRaw]
      : [];

  const signals: MBSBACRawSignal[] = [];

  for (const sig of xmlSignals) {
    const sigRecord = sig as XmlRecord;
    const idxExternal = toNumberValue(sigRecord.idxExternal, -1);
    const bacObj = objectMap.get(idxExternal);

    if (!bacObj) {
      warnings.push(
        `Modbus Slave Signal with idxExternal=${idxExternal} has no matching BACnet Client Object.`,
      );
      continue;
    }

    const modbusSlaveConfig = buildModbusSlaveConfig(sigRecord);
    const bacnetClientConfig = buildBacnetClientConfig(bacObj, deviceMap);

    const rawSig: MBSBACRawSignal = {
      idxExternal,
      name: modbusSlaveConfig.description,
      direction: 'Modbus Slave->BACnet Client',
      isCommError: modbusSlaveConfig.description.startsWith('Comm Error'),
      modbusSlave: modbusSlaveConfig,
      bacnetClient: bacnetClientConfig,
    };

    signals.push(rawSig);
  }

  // Check for orphan BACnet objects
  for (const idx of objectMap.keys()) {
    const hasSig = xmlSignals.some(
      (s) => toNumberValue((s as XmlRecord).idxExternal, -1) === idx,
    );
    if (!hasSig) {
      warnings.push(
        `BACnet Client Object with idxExternal=${idx} has no matching Modbus Slave Signal.`,
      );
    }
  }

  // Convert device map to array
  const devices = Array.from(deviceMap.values());

  return { signals, devices, warnings };
}
