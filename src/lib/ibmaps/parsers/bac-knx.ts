import { XMLParser } from 'fast-xml-parser';
import type { BACKNXRawSignal, BACnetConfig, KNXConfig } from '../types';

/**
 * Parse results for BACnet Server ↔ KNX ibmaps files
 */
export type ParseBACKNXResult = {
  signals: BACKNXRawSignal[];
  devices: []; // No devices for KNX external protocol
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
// Extract KNX Objects from ExternalProtocol
// -----------------------------------------------------
function extractKnxObjects(externalProtocol: XmlRecord): Map<number, XmlRecord> {
  const xmlKnxObjsRaw = asRecord(externalProtocol).KNXObject;
  const xmlKnxObjs = Array.isArray(xmlKnxObjsRaw)
    ? xmlKnxObjsRaw
    : xmlKnxObjsRaw
      ? [xmlKnxObjsRaw]
      : [];

  const knxObjectsMap = new Map<number, XmlRecord>();
  for (const obj of xmlKnxObjs) {
    const objRecord = obj as XmlRecord;
    const idxExternal = toNumberValue(objRecord.IdxExternal, -1);
    knxObjectsMap.set(idxExternal, objRecord);
  }

  return knxObjectsMap;
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
// Build BACnetConfig from BACnetObject record
// -----------------------------------------------------
function buildBacnetConfig(bacRecord: XmlRecord): BACnetConfig {
  const bacName = toStringValue(bacRecord.BACName);
  const description = toStringValue(bacRecord.Description);
  const type = toNumberValue(bacRecord.BACType, -1);
  const instance = toNumberValue(bacRecord.BACInstance, -1);
  const objectId = toNumberValue(bacRecord.ObjectID, -1);
  const active = toBoolean(bacRecord.Active);
  const polarity = toBoolean(bacRecord.Polarity);
  const lut = toNumberValue(bacRecord.LUT, -1);

  // Units
  const unitsRecord = asRecord(bacRecord.Units);
  const units = toNumberValue(unitsRecord['@_Value'], -1);

  // COV
  const cov = toNumberValue(bacRecord.COV, -1);

  // Relinquish
  const relinquish = toNumberValue(bacRecord.Relinquish, -1);

  // NumOfStates
  const numOfStates = toNumberValue(bacRecord.NumOfStates, -1);

  // Virtual
  const virtualRecord = asRecord(bacRecord.Virtual);
  const isVirtual = toBoolean(virtualRecord['@_Status']);

  // Extract remaining attrs for preservation
  const knownFields = new Set([
    'BACName', 'Description', 'BACType', 'BACInstance', 'ObjectID',
    'Polarity', 'LUT', 'MAP', 'idxConfig', 'idxExternal',
    'IdxOperations', 'IdxFilters', 'Active', 'Units', 'COV',
    'Relinquish', 'NumOfStates', 'NotificationClass', 'Virtual', 'ProtocolIndex', '@_ID',
  ]);
  const bacRest = Object.fromEntries(
    Object.entries(bacRecord).filter(([k]) => !knownFields.has(k)),
  );

  return {
    bacName,
    description,
    type,
    instance,
    objectId,
    units: units >= 0 ? units : undefined,
    cov: cov >= 0 ? cov : undefined,
    relinquish: relinquish >= 0 ? relinquish : undefined,
    numOfStates: numOfStates >= 0 ? numOfStates : undefined,
    active,
    lut: lut >= 0 ? lut : undefined,
    polarity,
    virtual: isVirtual,
    fixed: isVirtual ? toBoolean(virtualRecord['@_Fixed']) : undefined,
    extraAttrs: toStringRecord(bacRest),
  };
}

// -----------------------------------------------------
// Main parser
// -----------------------------------------------------
/**
 * Parses an IN-BAC-KNX.ibmaps XML content into BACKNXRawSignal model.
 */
export function parseIbmapsSignals_BAC_KNX(
  xmlContent: string,
): ParseBACKNXResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (_name: string, jpath: string) => {
      if (jpath.endsWith('InternalProtocol.BACnetObject')) return true;
      if (jpath.endsWith('ExternalProtocol.KNXObject')) return true;
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

  // 1. Extract KNX Objects from ExternalProtocol
  const externalProtocol = asRecord(project).ExternalProtocol;
  const knxObjectsMap = extractKnxObjects(asRecord(externalProtocol));

  // 2. Extract BACnet Objects from InternalProtocol
  const internalProtocol = asRecord(project).InternalProtocol;
  const xmlBacObjsRaw = asRecord(internalProtocol).BACnetObject;
  const xmlBacObjs = Array.isArray(xmlBacObjsRaw)
    ? xmlBacObjsRaw
    : xmlBacObjsRaw
      ? [xmlBacObjsRaw]
      : [];

  const signals: BACKNXRawSignal[] = [];

  for (const bacObj of xmlBacObjs) {
    const bacRecord = bacObj as XmlRecord;
    const idxExternal = toNumberValue(bacRecord.idxExternal, -1);
    const knxObj = knxObjectsMap.get(idxExternal);

    if (!knxObj) {
      warnings.push(
        `BACnetObject with idxExternal=${idxExternal} has no matching KNXObject.`,
      );
      continue;
    }

    const bacnetConfig = buildBacnetConfig(bacRecord);
    const knxConfig = buildKnxConfig(knxObj);

    const rawSig: BACKNXRawSignal = {
      idxExternal,
      name: bacnetConfig.bacName,
      direction: 'BACnet->KNX',
      isCommError: bacnetConfig.bacName.startsWith('Comm Error'),
      bacnet: bacnetConfig,
      knx: knxConfig,
    };

    signals.push(rawSig);
  }

  // Check for orphan KNX objects
  for (const idx of knxObjectsMap.keys()) {
    const hasBac = xmlBacObjs.some(
      (b) => toNumberValue((b as XmlRecord).idxExternal, -1) === idx,
    );
    if (!hasBac) {
      warnings.push(
        `KNXObject with IdxExternal=${idx} has no matching BACnetObject.`,
      );
    }
  }

  return { signals, devices: [], warnings };
}
