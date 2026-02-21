import { XMLParser } from 'fast-xml-parser';
import type { MBSKNXRawSignal } from '../types';

/**
 * Parse results for Modbus Slave → KNX ibmaps files
 */
export type ParseMBSKNXResult = {
  signals: MBSKNXRawSignal[];
  devices: []; // MBS-KNX has no device nodes
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
// Extract KNX Objects from ExternalProtocol
// -----------------------------------------------------
function extractKNXObjects(externalProtocol: XmlRecord): Map<number, XmlRecord> {
  const xmlKnxRaw = asRecord(externalProtocol).KNXObject;
  const xmlKnxObjs = Array.isArray(xmlKnxRaw)
    ? xmlKnxRaw
    : xmlKnxRaw
      ? [xmlKnxRaw]
      : [];

  const knxMap = new Map<number, XmlRecord>();
  for (const obj of xmlKnxObjs) {
    const objRecord = obj as XmlRecord;
    const idxExternal = toNumberValue(objRecord.IdxExternal, -1);
    knxMap.set(idxExternal, objRecord);
  }

  return knxMap;
}

// -----------------------------------------------------
// Build ListeningAddresses string
// -----------------------------------------------------
function buildListeningAddressesString(listeningAddresses: unknown): string | undefined {
  if (!listeningAddresses) return undefined;
  
  const record = asRecord(listeningAddresses);
  const addresses = record.Address;
  
  if (!addresses) return undefined;
  
  const addrArray = Array.isArray(addresses) ? addresses : [addresses];
  const strings = addrArray
    .map((addr) => toStringValue(asRecord(addr)['@_String']))
    .filter((s) => s.length > 0);
  
  return strings.length > 0 ? strings.join(', ') : undefined;
}

// -----------------------------------------------------
// Main parser
// -----------------------------------------------------
/**
 * Parses an IN-MBS-KNX.ibmaps XML content into MBSKNXRawSignal model.
 */
export function parseIbmapsSignals_MBS_KNX(
  xmlContent: string,
): ParseMBSKNXResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (_name: string, jpath: string) => {
      if (jpath.endsWith('InternalProtocol.Signals.Signal')) return true;
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

  // 1. Extract KNX Objects from External Protocol
  const externalProtocol = asRecord(project).ExternalProtocol;
  const knxObjectsMap = extractKNXObjects(asRecord(externalProtocol));

  // 2. Extract Modbus Slave Signals from Internal Protocol
  const internalProtocol = asRecord(project).InternalProtocol;
  const xmlSignalsRaw = asRecord(asRecord(internalProtocol).Signals).Signal;
  const xmlSignals = Array.isArray(xmlSignalsRaw)
    ? xmlSignalsRaw
    : xmlSignalsRaw
      ? [xmlSignalsRaw]
      : [];

  const signals: MBSKNXRawSignal[] = [];

  for (const sig of xmlSignals) {
    const sigRecord = sig as XmlRecord;
    const idxExternal = toNumberValue(sigRecord.idxExternal, -1);
    const knxObj = knxObjectsMap.get(idxExternal);

    if (!knxObj) {
      warnings.push(
        `Modbus Slave Signal with idxExternal=${idxExternal} has no matching KNXObject.`,
      );
      continue;
    }

    // Extract Modbus Slave fields
    const description = toStringValue(sigRecord.Description);
    const isEnabled = toBoolean(sigRecord.isEnabled);
    const lenBits = toNumberValue(sigRecord.LenBits, 16);
    const format = toNumberValue(sigRecord.Format, 0);
    const address = toNumberValue(sigRecord.Address, 0);
    const bit = toNumberValue(sigRecord.Bit, -1);
    const readWrite = toNumberValue(sigRecord.ReadWrite, 0);
    const stringLength = toNumberValue(sigRecord.StringLength, -1);

    // Virtual config
    const virtualRecord = asRecord(sigRecord.Virtual);
    const isVirtual = toBoolean(virtualRecord['@_Status']);

    // Extract remaining attrs for preservation
    const knownSignalFields = new Set([
      'isEnabled', 'idxConfig', 'idxExternal', 'IdxOperations', 'IdxFilters',
      'Description', 'LenBits', 'Format', 'Bit', 'Address', 'ReadWrite',
      'StringLength', 'SlaveIndex', 'GatewayIndex', 'Virtual', 'ProtocolIndex', '@_ID',
    ]);
    const sigRest = Object.fromEntries(
      Object.entries(sigRecord).filter(([k]) => !knownSignalFields.has(k)),
    );

    // Extract KNX fields
    const knxDescription = toStringValue(knxObj.Description);
    const knxActive = toBoolean(knxObj.Active);

    // DPT
    const dptRecord = asRecord(knxObj.DPT);
    const dptValue = toNumberValue(dptRecord['@_Value'], -1);

    // SendingAddress (Group Address)
    const sendingAddr = asRecord(knxObj.SendingAddress);
    const groupAddressValue = toNumberValue(sendingAddr['@_Value'], -1);
    const groupAddress = toStringValue(sendingAddr['@_String']);

    // ListeningAddresses (Additional Addresses)
    const additionalAddresses = buildListeningAddressesString(knxObj.ListeningAddresses);

    // Flags
    const flagsRecord = asRecord(knxObj.Flags);
    const flags = {
      u: toBoolean(flagsRecord['@_U']),
      t: toBoolean(flagsRecord['@_T']),
      ri: toBoolean(flagsRecord['@_Ri']),
      w: toBoolean(flagsRecord['@_W']),
      r: toBoolean(flagsRecord['@_R']),
    };

    // Priority
    const priority = toNumberValue(knxObj.Priority, 3);

    // KNX Virtual
    const knxVirtualRecord = asRecord(knxObj.Virtual);
    const knxIsVirtual = toBoolean(knxVirtualRecord['@_Status']);

    // Extract remaining KNX attrs for preservation
    const knownKnxFields = new Set([
      'Description', 'Active', 'DPT', 'SendingAddress', 'ListeningAddresses',
      'Flags', 'Priority', 'Virtual', 'IdxExternal', 'IdxConfig',
      'IdxOperations', 'IdxFilters', 'AllowedValues', 'UpdateGA', 'ProtocolIndex', '@_ID',
    ]);
    const knxRest = Object.fromEntries(
      Object.entries(knxObj).filter(([k]) => !knownKnxFields.has(k)),
    );

    const rawSig: MBSKNXRawSignal = {
      idxExternal,
      name: description || knxDescription,
      direction: 'Modbus Slave->KNX',
      isCommError: description.startsWith('Comm Error'),

      modbusSlave: {
        description,
        dataLength: lenBits,
        format,
        address,
        bit,
        readWrite,
        stringLength,
        isEnabled,
        virtual: isVirtual,
        fixed: isVirtual ? toBoolean(virtualRecord['@_Fixed']) : undefined,
        extraAttrs: toStringRecord(sigRest),
      },

      knx: {
        description: knxDescription,
        active: knxActive,
        dptValue,
        groupAddress,
        groupAddressValue,
        additionalAddresses,
        flags,
        priority,
        virtual: knxIsVirtual,
        fixed: knxIsVirtual ? toBoolean(knxVirtualRecord['@_Fixed']) : undefined,
        extraAttrs: toStringRecord(knxRest),
      },
    };

    signals.push(rawSig);
  }

  // Check for orphan KNX objects
  for (const idx of knxObjectsMap.keys()) {
    const hasSignal = xmlSignals.some(
      (s) => toNumberValue((s as XmlRecord).idxExternal, -1) === idx,
    );
    if (!hasSignal) {
      warnings.push(
        `KNXObject with IdxExternal=${idx} has no matching Modbus Slave Signal.`,
      );
    }
  }

  return { signals, devices: [], warnings };
}
