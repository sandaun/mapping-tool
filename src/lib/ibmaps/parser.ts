import { XMLParser } from 'fast-xml-parser';
import type { RawSignal, IbmapsDevice } from './types';

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
export function parseIbmapsSignals_BAC_MBM(xmlContent: string): ParseIbmapsResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name, jpath) => {
      // Force arrays for repeatable elements
      if (jpath.endsWith('ExternalProtocol.RtuNodes.RtuNode.Device')) return true;
      if (jpath.endsWith('ExternalProtocol.Signals.Signal')) return true;
      if (jpath.endsWith('InternalProtocol.BACnetObject')) return true;
      return false;
    },
  });

  const parsed = parser.parse(xmlContent);
  const project = parsed.Project;

  const warnings: string[] = [];

  if (!project) {
    throw new Error('Invalid XML: Root <Project> element not found.');
  }

  // 1. Extract Devices (Flat list from all RtuNodes)
  const devices: IbmapsDevice[] = [];
  const rtuNodes = project.ExternalProtocol?.RtuNodes?.RtuNode;

  if (rtuNodes) {
    // rtuNodes can be an array or single object depending on XML structure/parser settings, 
    // but usually in these files there is a list of nodes. 
    // However, the parser 'isArray' option above helps.
    const nodesArray = Array.isArray(rtuNodes) ? rtuNodes : [rtuNodes];

    for (const node of nodesArray) {
      if (node.Device) {
        for (const dev of node.Device) {
          devices.push({
            index: parseInt(dev['@_Index'], 10),
            name: dev['@_Name'] || '',
            slaveNum: parseInt(dev['@_SlaveNum'], 10),
            manufacturer: dev['@_Manufacturer'],
            baseRegister: dev['@_BaseRegister'] ? parseInt(dev['@_BaseRegister'], 10) : undefined,
            timeout: dev['@_Timeout'] ? parseInt(dev['@_Timeout'], 10) : undefined,
            enabled: dev['@_Enabled'] === 'True',
          });
        }
      }
    }
  }

  // Map for quick device lookup
  const devicesByIndex = new Map(devices.map((d) => [d.index, d]));

  // 2. Extract Signals (Modbus)
  const xmlSignals = project.ExternalProtocol?.Signals?.Signal || [];
  const modbusSignalsMap = new Map<number, any>();

  for (const sig of xmlSignals) {
    const idxExternal = parseInt(sig.idxExternal, 10);
    modbusSignalsMap.set(idxExternal, sig);
  }

  // 3. Extract BACnet Objects (Internal)
  const xmlBacObjs = project.InternalProtocol?.BACnetObject || [];
  const signals: RawSignal[] = [];

  for (const bacObj of xmlBacObjs) {
    const idxExternal = parseInt(bacObj.idxExternal, 10);
    const modSig = modbusSignalsMap.get(idxExternal);

    if (!modSig) {
      warnings.push(`BACnetObject with idxExternal=${idxExternal} has no matching Modbus Signal.`);
      continue;
    }

    // --- Build RawSignal ---

    // 3.1 BACnet part
    // Extract unknown attributes for preservation
    const {
      BACName,
      BACType,
      BACInstance,
      Units,
      StatusFlags, // Usually complex object or missing
      idxExternal: _idx1,
      ...bacRest
    } = bacObj;

    // Handle MAP node specifically
    // Assuming 1 MAP per object as per spec
    // MAP can be "-1" string if not configured/mapped, or an object
    let mapData: any = {};
    if (bacObj.MAP && typeof bacObj.MAP === 'object') {
       mapData = bacObj.MAP;
    }

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
       RegType, // Might be missing on Signal node
       DataType, // Might be missing on Signal node
       ScanPeriod,
       Virtual,
       idxExternal: _idx2,
       ...modRest
    } = modSig;

    const devIndex = parseInt(DeviceIndex, 10);
    const linkedDevice = devicesByIndex.get(devIndex);

    // Heuristic for Virtual
    const isVirtual = Virtual && Virtual['@_Status'] === 'True';

    const rawSig: RawSignal = {
      idxExternal,
      name: BACName,
      direction: 'BACnet->Modbus',
      isCommError: BACName.startsWith('Comm Error'),
      
      bacnet: {
        bacName: BACName,
        type: parseInt(BACType, 10),
        instance: parseInt(BACInstance, 10),
        units: Units && Units['@_Value'] ? parseInt(Units['@_Value'], 10) : undefined,
        extraAttrs: bacRest,
        map: {
          address: parseInt(mapAddr ?? '-1', 10),
          regType: parseInt(mapRegType ?? '-1', 10),
          dataType: parseInt(mapDataType ?? '-1', 10),
          readFunc: parseInt(mapReadFunc ?? '-1', 10),
          writeFunc: parseInt(mapWriteFunc ?? '-1', 10),
          pollPriority: mapPollPriority ? parseInt(mapPollPriority, 10) : undefined,
          extraAttrs: mapRest
        }
      },

      modbus: {
        deviceIndex: devIndex,
        slaveNum: linkedDevice ? linkedDevice.slaveNum : -1,
        description: Description,
        address: parseInt(Address ?? '-1', 10),
        readFunc: parseInt(ReadFunc ?? '-1', 10),
        writeFunc: parseInt(WriteFunc ?? '-1', 10),
        regType: RegType ? parseInt(RegType, 10) : undefined, 
        dataType: DataType ? parseInt(DataType, 10) : undefined,
        scanPeriod: ScanPeriod ? parseInt(ScanPeriod, 10) : undefined,
        virtual: isVirtual,
        fixed: isVirtual ? (Virtual['@_Fixed'] === 'True') : undefined,
        enable: isVirtual ? (Virtual['@_Enable'] === 'True') : undefined,
        extraAttrs: modRest
      }
    };

    signals.push(rawSig);
  }

  // Check for Modbus signals without BACnet object (orphans)
  for (const [idx, modSig] of modbusSignalsMap) {
    const hasBac = xmlBacObjs.some((b: any) => parseInt(b.idxExternal, 10) === idx);
    if (!hasBac) {
      warnings.push(`Modbus Signal with idxExternal=${idx} has no matching BACnetObject.`);
    }
  }

  return { signals, devices, warnings };
}
