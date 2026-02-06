import { XMLParser } from 'fast-xml-parser';
import type { RawSignal, IbmapsDevice } from '../types';

/**
 * Parse results containing extracted signals and device configurations
 */
export type ParseIbmapsResult = {
  signals: RawSignal[];
  devices: IbmapsDevice[];
  warnings: string[];
};

/**
 * Parses an IN-BAC-MBM.ibmaps XML content into a RawSignal model.
 *
 * @param xmlContent The content of the .ibmaps file
 * @returns ParseIbmapsResult
 */
export function parseIbmapsSignals_BAC_MBM(
  xmlContent: string,
): ParseIbmapsResult {
  type XmlRecord = Record<string, unknown>;

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

  const toStringRecord = (record: XmlRecord): Record<string, string> =>
    Object.fromEntries(
      Object.entries(record).map(([key, val]) => [key, toStringValue(val)]),
    );

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name, jpath) => {
      if (jpath.endsWith('ExternalProtocol.RtuNodes.RtuNode.Device'))
        return true;
      if (jpath.endsWith('ExternalProtocol.Signals.Signal')) return true;
      if (jpath.endsWith('InternalProtocol.BACnetObject')) return true;
      return false;
    },
  });

  const parsed = parser.parse(xmlContent);
  const project = parsed.Project as XmlRecord | undefined;

  const warnings: string[] = [];

  if (!project) {
    throw new Error('Invalid XML: Root <Project> element not found.');
  }

  // 1. Extract Devices (Flat list from all RtuNodes)
  const devices: IbmapsDevice[] = [];
  const externalProtocol = asRecord(project).ExternalProtocol;
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
            enabled: devRecord['@_Enabled'] === 'True',
          });
        }
      }
    }
  }

  // Map for quick device lookup
  const devicesByIndex = new Map(devices.map((d) => [d.index, d]));

  // 2. Extract Signals (Modbus)
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

  // 3. Extract BACnet Objects (Internal)
  const internalProtocol = asRecord(project).InternalProtocol;
  const xmlBacObjsRaw = asRecord(internalProtocol).BACnetObject;
  const xmlBacObjs = Array.isArray(xmlBacObjsRaw)
    ? xmlBacObjsRaw
    : xmlBacObjsRaw
      ? [xmlBacObjsRaw]
      : [];
  const signals: RawSignal[] = [];

  for (const bacObj of xmlBacObjs) {
    const bacRecord = bacObj as XmlRecord;
    const idxExternal = toNumberValue(bacRecord.idxExternal, -1);
    const modSig = modbusSignalsMap.get(idxExternal);

    if (!modSig) {
      warnings.push(
        `BACnetObject with idxExternal=${idxExternal} has no matching Modbus Signal.`,
      );
      continue;
    }

    // --- Build RawSignal ---

    // 3.1 BACnet part
    const { BACName, BACType, BACInstance, Units, ...bacRest } = bacRecord;

    // Handle MAP node specifically
    const mapData = asRecord(bacRecord.MAP);

    const {
      '@_Address': mapAddr,
      '@_RegType': mapRegType,
      '@_DataType': mapDataType,
      '@_ReadFunc': mapReadFunc,
      '@_WriteFunc': mapWriteFunc,
      '@_PollPriority': mapPollPriority,
      ...mapRest
    } = mapData;

    // 3.2 Modbus part
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

    // Heuristic for Virtual
    const virtualRecord = asRecord(Virtual);
    const isVirtual = virtualRecord['@_Status'] === 'True';

    const rawSig: RawSignal = {
      idxExternal,
      name: toStringValue(BACName),
      direction: 'BACnet->Modbus',
      isCommError: toStringValue(BACName).startsWith('Comm Error'),

      bacnet: {
        bacName: toStringValue(BACName),
        type: toNumberValue(BACType, 0),
        instance: toNumberValue(BACInstance, 0),
        units:
          Units && asRecord(Units)['@_Value']
            ? toNumberValue(asRecord(Units)['@_Value'], -1)
            : undefined,
        extraAttrs: toStringRecord(bacRest),
        map: {
          address: toNumberValue(mapAddr, -1),
          regType: toNumberValue(mapRegType, -1),
          dataType: toNumberValue(mapDataType, -1),
          readFunc: toNumberValue(mapReadFunc, -1),
          writeFunc: toNumberValue(mapWriteFunc, -1),
          pollPriority: mapPollPriority
            ? toNumberValue(mapPollPriority, -1)
            : undefined,
          extraAttrs: toStringRecord(mapRest),
        },
      },

      modbus: {
        deviceIndex: devIndex,
        slaveNum: linkedDevice ? linkedDevice.slaveNum : -1,
        description: toStringValue(Description) || undefined,
        address: toNumberValue(Address, -1),
        readFunc: toNumberValue(ReadFunc, -1),
        writeFunc: toNumberValue(WriteFunc, -1),
        regType: RegType ? toNumberValue(RegType, -1) : undefined,
        dataType: DataType ? toNumberValue(DataType, -1) : undefined,
        lenBits: LenBits ? toOptionalNumber(LenBits) : undefined,
        format: Format ? toOptionalNumber(Format) : undefined,
        byteOrder: ByteOrder ? toOptionalNumber(ByteOrder) : undefined,
        bit: Bit ? toOptionalNumber(Bit) : undefined,
        numOfBits: NumOfBits ? toOptionalNumber(NumOfBits) : undefined,
        deadband: Deadband ? toOptionalNumber(Deadband) : undefined,
        scanPeriod: ScanPeriod ? toOptionalNumber(ScanPeriod) : undefined,
        virtual: Boolean(isVirtual),
        fixed: isVirtual
          ? toStringValue(virtualRecord['@_Fixed']) === 'True'
          : undefined,
        enable: isVirtual
          ? toStringValue(virtualRecord['@_Enable']) === 'True'
          : undefined,
        extraAttrs: toStringRecord(modRest),
      },
    };

    signals.push(rawSig);
  }

  // Check for Modbus signals without BACnet object (orphans)
  const getIdxExternal = (record: XmlRecord): number =>
    toNumberValue(record.idxExternal, -1);

  for (const idx of modbusSignalsMap.keys()) {
    const hasBac = xmlBacObjs.some((b) => getIdxExternal(b) === idx);
    if (!hasBac) {
      warnings.push(
        `Modbus Signal with idxExternal=${idx} has no matching BACnetObject.`,
      );
    }
  }

  return { signals, devices, warnings };
}
