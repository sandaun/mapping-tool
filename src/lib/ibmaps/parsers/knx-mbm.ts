import { XMLParser } from 'fast-xml-parser';
import type { KNXRawSignal, IbmapsDevice, ModbusConfig } from '../types';

/**
 * Parse results for KNX → Modbus Master ibmaps files
 */
export type ParseKNXMBMResult = {
  signals: KNXRawSignal[];
  devices: IbmapsDevice[];
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

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const toBoolean = (value: unknown): boolean =>
  toStringValue(value) === 'True';

const toStringRecord = (record: XmlRecord): Record<string, string> =>
  Object.fromEntries(
    Object.entries(record).map(([key, val]) => [key, toStringValue(val)]),
  );

// -----------------------------------------------------
// Device extraction (shared with BAC-MBM)
// -----------------------------------------------------
function extractDevices(externalProtocol: XmlRecord): IbmapsDevice[] {
  const devices: IbmapsDevice[] = [];
  const rtuNodeEntries = asRecord(asRecord(externalProtocol).RtuNodes).RtuNode;

  if (rtuNodeEntries) {
    const nodesArray = Array.isArray(rtuNodeEntries)
      ? rtuNodeEntries
      : [rtuNodeEntries];

    for (const node of nodesArray) {
      const nodeRecord = node as XmlRecord;
      if (nodeRecord.Device) {
        const devicesArray = Array.isArray(nodeRecord.Device)
          ? nodeRecord.Device
          : [nodeRecord.Device];
        for (const dev of devicesArray) {
          const devRecord = dev as XmlRecord;
          devices.push({
            index: toNumberValue(devRecord['@_Index'], -1),
            name: toStringValue(devRecord['@_Name']),
            slaveNum: toNumberValue(devRecord['@_SlaveNum'], -1),
            manufacturer: toStringValue(devRecord['@_Manufacturer']),
            baseRegister: devRecord['@_BaseRegister']
              ? toNumberValue(devRecord['@_BaseRegister'], 0)
              : undefined,
            timeout: devRecord['@_Timeout']
              ? toNumberValue(devRecord['@_Timeout'], 1000)
              : undefined,
            enabled: toBoolean(devRecord['@_Enabled']),
          });
        }
      }
    }
  }

  return devices;
}

// -----------------------------------------------------
// Modbus Signal extraction (shared with BAC-MBM)
// -----------------------------------------------------
function extractModbusSignals(externalProtocol: XmlRecord): Map<number, XmlRecord> {
  const xmlSignalsRaw = asRecord(asRecord(externalProtocol).Signals).Signal;
  const xmlSignals = Array.isArray(xmlSignalsRaw)
    ? xmlSignalsRaw
    : xmlSignalsRaw
      ? [xmlSignalsRaw]
      : [];

  const modbusSignalsMap = new Map<number, XmlRecord>();
  for (const sig of xmlSignals) {
    const sigRecord = sig as XmlRecord;
    const idxExternal = toNumberValue(sigRecord.idxExternal, -1);
    modbusSignalsMap.set(idxExternal, sigRecord);
  }

  return modbusSignalsMap;
}

// -----------------------------------------------------
// Build ModbusConfig from signal record
// -----------------------------------------------------
function buildModbusConfig(
  modSig: XmlRecord,
  devicesByIndex: Map<number, IbmapsDevice>,
): ModbusConfig {
  const {
    DeviceIndex,
    Description,
    Address,
    ReadFunc,
    WriteFunc,
    RegType,
    DataType,
    LenBits,
    Format,
    ByteOrder,
    Bit,
    NumOfBits,
    Deadband,
    ScanPeriod,
    Virtual,
    ...modRest
  } = modSig;

  const devIndex = toNumberValue(DeviceIndex, -1);
  const linkedDevice = devicesByIndex.get(devIndex);
  const virtualRecord = asRecord(Virtual);
  const isVirtual = toBoolean(virtualRecord['@_Status']);

  return {
    deviceIndex: devIndex,
    slaveNum: linkedDevice ? linkedDevice.slaveNum : -1,
    description: toStringValue(Description) || undefined,
    address: toNumberValue(Address, -1),
    readFunc: toNumberValue(ReadFunc, -1),
    writeFunc: toNumberValue(WriteFunc, -1),
    regType: RegType ? toNumberValue(RegType, -1) : undefined,
    dataType: DataType ? toNumberValue(DataType, -1) : undefined,
    lenBits: toOptionalNumber(LenBits),
    format: toOptionalNumber(Format),
    byteOrder: toOptionalNumber(ByteOrder),
    bit: toOptionalNumber(Bit),
    numOfBits: toOptionalNumber(NumOfBits),
    deadband: toOptionalNumber(Deadband),
    scanPeriod: toOptionalNumber(ScanPeriod),
    virtual: isVirtual,
    fixed: isVirtual ? toBoolean(virtualRecord['@_Fixed']) : undefined,
    enable: isVirtual ? toBoolean(virtualRecord['@_Enable']) : undefined,
    extraAttrs: toStringRecord(modRest),
  };
}

// -----------------------------------------------------
// Main parser
// -----------------------------------------------------
/**
 * Parses an IN-KNX-MBM.ibmaps XML content into KNXRawSignal model.
 */
export function parseIbmapsSignals_KNX_MBM(
  xmlContent: string,
): ParseKNXMBMResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (_name: string, jpath: string) => {
      if (jpath.endsWith('ExternalProtocol.RtuNodes.RtuNode.Device')) return true;
      if (jpath.endsWith('ExternalProtocol.Signals.Signal')) return true;
      if (jpath.endsWith('InternalProtocol.KNXObject')) return true;
      return false;
    },
  });

  const parsed = parser.parse(xmlContent);
  const project = parsed.Project as XmlRecord | undefined;
  const warnings: string[] = [];

  if (!project) {
    throw new Error('Invalid XML: Root <Project> element not found.');
  }

  // 1. Extract Devices
  const externalProtocol = asRecord(project).ExternalProtocol;
  const devices = extractDevices(asRecord(externalProtocol));
  const devicesByIndex = new Map(devices.map((d) => [d.index, d]));

  // 2. Extract Modbus Signals
  const modbusSignalsMap = extractModbusSignals(asRecord(externalProtocol));

  // 3. Extract KNX Objects
  const internalProtocol = asRecord(project).InternalProtocol;
  const xmlKnxObjsRaw = asRecord(internalProtocol).KNXObject;
  const xmlKnxObjs = Array.isArray(xmlKnxObjsRaw)
    ? xmlKnxObjsRaw
    : xmlKnxObjsRaw
      ? [xmlKnxObjsRaw]
      : [];

  const signals: KNXRawSignal[] = [];

  for (const knxObj of xmlKnxObjs) {
    const knxRecord = knxObj as XmlRecord;
    const idxExternal = toNumberValue(knxRecord.IdxExternal, -1);
    const modSig = modbusSignalsMap.get(idxExternal);

    if (!modSig) {
      warnings.push(
        `KNXObject with IdxExternal=${idxExternal} has no matching Modbus Signal.`,
      );
      continue;
    }

    // Extract KNX specific fields
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
    const listeningAddrs = knxRecord.ListeningAddresses;
    const additionalAddresses = listeningAddrs 
      ? toStringValue(listeningAddrs)
      : undefined;

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

    // Extract remaining attrs for preservation (omit known fields)
    const knownFields = new Set([
      'Description', 'Active', 'DPT', 'SendingAddress', 'ListeningAddresses',
      'Flags', 'Priority', 'Virtual', 'IdxExternal', 'IdxConfig',
      'IdxOperations', 'IdxFilters', 'AllowedValues', 'UpdateGA', 'ProtocolIndex', '@_ID',
    ]);
    const knxRest = Object.fromEntries(
      Object.entries(knxRecord).filter(([k]) => !knownFields.has(k)),
    );

    const rawSig: KNXRawSignal = {
      idxExternal,
      name: description,
      direction: 'KNX->Modbus',
      isCommError: description.startsWith('Comm Error'),

      knx: {
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
      },

      modbus: buildModbusConfig(modSig, devicesByIndex),
    };

    signals.push(rawSig);
  }

  // Check for orphan Modbus signals
  for (const idx of modbusSignalsMap.keys()) {
    const hasKnx = xmlKnxObjs.some(
      (k) => toNumberValue((k as XmlRecord).IdxExternal, -1) === idx,
    );
    if (!hasKnx) {
      warnings.push(
        `Modbus Signal with idxExternal=${idx} has no matching KNXObject.`,
      );
    }
  }

  return { signals, devices, warnings };
}
