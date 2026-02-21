import { XMLParser } from 'fast-xml-parser';
import type { KNXBACRawSignal, KNXConfig, BACnetClientConfig, BACnetClientDevice } from '../types';

/**
 * Parse results for KNX ← BACnet Client ibmaps files
 */
export type ParseKNXBACResult = {
  signals: KNXBACRawSignal[];
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
// Extract additional addresses from ListeningAddresses
// -----------------------------------------------------
function extractAdditionalAddresses(listeningAddrs: unknown): string | undefined {
  if (!listeningAddrs) return undefined;

  const record = asRecord(listeningAddrs);
  const addresses = record.Address;

  if (!addresses) return undefined;

  const addressArray = Array.isArray(addresses) ? addresses : [addresses];
  const strings = addressArray
    .map((addr) => toStringValue(asRecord(addr)['@_String']))
    .filter((s) => s.length > 0);

  return strings.length > 0 ? strings.join(', ') : undefined;
}

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
// Build KNXConfig from KNXObject record
// -----------------------------------------------------
function buildKnxConfig(knxRecord: XmlRecord): KNXConfig {
  const description = toStringValue(knxRecord.Description);
  const active = toBoolean(knxRecord.Active);

  // DPT
  const dptRecord = asRecord(knxRecord.DPT);
  const dptValue = toNumberValue(dptRecord['@_Value'], -1);

  // SendingAddress (Group Address)
  const sendingAddr = asRecord(knxRecord.SendingAddress);
  const groupAddressValue = toNumberValue(sendingAddr['@_Value'], -1);
  const groupAddress = toStringValue(sendingAddr['@_String']);

  // ListeningAddresses (Additional Addresses)
  const additionalAddresses = extractAdditionalAddresses(knxRecord.ListeningAddresses);

  // Flags
  const flagsRecord = asRecord(knxRecord.Flags);
  const flags = {
    u: toBoolean(flagsRecord['@_U']),
    t: toBoolean(flagsRecord['@_T']),
    ri: toBoolean(flagsRecord['@_Ri']),
    w: toBoolean(flagsRecord['@_W']),
    r: toBoolean(flagsRecord['@_R']),
  };

  // Priority
  const priority = toNumberValue(knxRecord.Priority, 3);

  // Virtual
  const virtualRecord = asRecord(knxRecord.Virtual);
  const isVirtual = toBoolean(virtualRecord['@_Status']);

  // Extract remaining attrs for preservation
  const knownFields = new Set([
    'Description', 'Active', 'DPT', 'SendingAddress', 'ListeningAddresses',
    'Flags', 'Priority', 'Virtual', 'IdxExternal', 'IdxConfig',
    'IdxOperations', 'IdxFilters', 'AllowedValues', 'UpdateGA', 'ProtocolIndex', '@_ID',
  ]);
  const knxRest = Object.fromEntries(
    Object.entries(knxRecord).filter(([k]) => !knownFields.has(k)),
  );

  return {
    description,
    active,
    dptValue,
    groupAddress,
    groupAddressValue,
    additionalAddresses,
    flags,
    priority,
    virtual: isVirtual,
    fixed: isVirtual ? toBoolean(virtualRecord['@_Fixed']) : undefined,
    extraAttrs: toStringRecord(knxRest),
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
 * Parses an IN-KNX-BAC.ibmaps XML content into KNXBACRawSignal model.
 */
export function parseIbmapsSignals_KNX_BAC(
  xmlContent: string,
): ParseKNXBACResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (_name: string, jpath: string) => {
      if (jpath.endsWith('InternalProtocol.KNXObject')) return true;
      if (jpath.endsWith('ExternalProtocol.Objects.Object')) return true;
      if (jpath.endsWith('ExternalProtocol.BACnetDevices.BACnetDevice')) return true;
      if (jpath.endsWith('ListeningAddresses.Address')) return true;
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

  // 2. Extract KNX Objects from InternalProtocol
  const internalProtocol = asRecord(project).InternalProtocol;
  const xmlKnxObjsRaw = asRecord(internalProtocol).KNXObject;
  const xmlKnxObjs = Array.isArray(xmlKnxObjsRaw)
    ? xmlKnxObjsRaw
    : xmlKnxObjsRaw
      ? [xmlKnxObjsRaw]
      : [];

  const signals: KNXBACRawSignal[] = [];

  for (const knxObj of xmlKnxObjs) {
    const knxRecord = knxObj as XmlRecord;
    const idxExternal = toNumberValue(knxRecord.IdxExternal, -1);
    const bacObj = objectMap.get(idxExternal);

    if (!bacObj) {
      warnings.push(
        `KNXObject with IdxExternal=${idxExternal} has no matching BACnet Client Object.`,
      );
      continue;
    }

    const knxConfig = buildKnxConfig(knxRecord);
    const bacnetClientConfig = buildBacnetClientConfig(bacObj, deviceMap);

    const rawSig: KNXBACRawSignal = {
      idxExternal,
      name: knxConfig.description,
      direction: 'KNX->BACnet Client',
      isCommError: knxConfig.description.startsWith('Comm Error'),
      knx: knxConfig,
      bacnetClient: bacnetClientConfig,
    };

    signals.push(rawSig);
  }

  // Check for orphan BACnet objects
  for (const idx of objectMap.keys()) {
    const hasKnx = xmlKnxObjs.some(
      (k) => toNumberValue((k as XmlRecord).IdxExternal, -1) === idx,
    );
    if (!hasKnx) {
      warnings.push(
        `BACnet Client Object with idxExternal=${idx} has no matching KNXObject.`,
      );
    }
  }

  // Convert device map to array
  const devices = Array.from(deviceMap.values());

  return { signals, devices, warnings };
}
