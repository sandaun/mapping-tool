import type { MBSBACRawSignal, BACnetClientDevice } from '../types';

// BACnet object type to ObjectID base multiplier
const BAC_TYPE_OBJECT_ID_BASE: Record<number, number> = {
  0: 0, // AI
  1: 4194304, // AO (1 << 22)
  2: 8388608, // AV (2 << 22)
  3: 12582912, // BI (3 << 22)
  4: 16777216, // BO (4 << 22)
  5: 20971520, // BV (5 << 22)
  13: 54525952, // MI (13 << 22)
  14: 58720256, // MO (14 << 22)
  19: 79691776, // MV (19 << 22)
};

/**
 * Adds new signals to an existing IN-MBS-BAC.ibmaps XML string.
 * Injects both <Signal> nodes (InternalProtocol/Signals) and <Object> nodes (ExternalProtocol/Objects).
 * Optionally injects new <BACnetDevice> nodes if needed.
 *
 * @param templateXmlText The original XML content
 * @param newSignals The list of new MBSBACRawSignals to append
 * @param newDevices Optional list of new BACnet devices to append
 * @returns The modified XML string
 */
export function addSignals_MBS_BAC(
  templateXmlText: string,
  newSignals: MBSBACRawSignal[],
  newDevices: BACnetClientDevice[] = [],
): string {
  if (newSignals.length === 0 && newDevices.length === 0) {
    return templateXmlText;
  }

  // Detect indentation/eol style from the file
  const eol = templateXmlText.includes('\r\n') ? '\r\n' : '\n';

  let result = templateXmlText;

  // 0. Inject BACnet Devices if needed
  if (newDevices.length > 0) {
    const bacnetDevicesEndTag = '</BACnetDevices>';
    const bacnetDevicesEndIdx = result.indexOf(bacnetDevicesEndTag);
    if (bacnetDevicesEndIdx !== -1) {
      const deviceIndent = deriveIndent(result, bacnetDevicesEndIdx) + '  ';
      const devicesXml = newDevices
        .map((d) => generateBacnetDeviceXml(d, deviceIndent))
        .join(eol);

      result = insertAfterLastNewlineBefore(
        result,
        bacnetDevicesEndIdx,
        `${devicesXml}${eol}`,
      );
    }
  }

  // 1. Inject Modbus Slave Signals (InternalProtocol/Signals side)
  const signalsEndTag = '</Signals>';
  const signalsEndIdx = result.indexOf(signalsEndTag);
  if (signalsEndIdx !== -1) {
    const signalIndent = deriveIndent(result, signalsEndIdx) + '  ';
    const signalsXml = newSignals
      .map((s) => generateModbusSlaveSignalXml(s, signalIndent, eol))
      .join(eol);

    result = insertAfterLastNewlineBefore(
      result,
      signalsEndIdx,
      `${signalsXml}${eol}`,
    );
  }

  // 2. Inject BACnet Client Objects (ExternalProtocol/Objects side)
  const objectsEndTag = '</Objects>';
  const objectsEndIdx = result.indexOf(objectsEndTag);
  if (objectsEndIdx !== -1) {
    const objIndent = deriveIndent(result, objectsEndIdx) + '  ';
    const objXml = newSignals
      .map((s) => generateBacnetClientObjectXml(s, objIndent, eol))
      .join(eol);

    result = insertAfterLastNewlineBefore(
      result,
      objectsEndIdx,
      `${objXml}${eol}`,
    );
  }

  return result;
}

function insertAfterLastNewlineBefore(
  original: string,
  limitIdx: number,
  content: string,
): string {
  let insertPos = limitIdx;
  for (let i = limitIdx - 1; i >= 0; i--) {
    if (original[i] === '\n') {
      insertPos = i + 1;
      break;
    }
    if (original[i] !== ' ' && original[i] !== '\t' && original[i] !== '\r') {
      insertPos = limitIdx;
      break;
    }
  }
  return original.slice(0, insertPos) + content + original.slice(insertPos);
}

function deriveIndent(xml: string, index: number): string {
  let i = index - 1;
  while (i >= 0 && xml[i] !== '\n') {
    i--;
  }
  const lineStart = i + 1;
  const lineStr = xml.slice(lineStart, index);
  const match = lineStr.match(/^([ \t]*)/);
  return match ? match[1] : '';
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Calculate ObjectID from BACType and Instance
 */
function calculateObjectId(type: number, instance: number): number {
  const base = BAC_TYPE_OBJECT_ID_BASE[type] ?? 0;
  return base + instance;
}

/**
 * Generate Modbus Slave Signal XML (for InternalProtocol/Signals)
 */
function generateModbusSlaveSignalXml(
  s: MBSBACRawSignal,
  indent: string,
  eol: string,
): string {
  const m = s.modbusSlave;
  const innerIndent = indent + '  ';

  const lines = [
    `${indent}<Signal ID="${s.idxExternal}">`,
    `${innerIndent}<isEnabled>${m.isEnabled ? 'True' : 'False'}</isEnabled>`,
    `${innerIndent}<idxConfig>${s.idxExternal}</idxConfig>`,
    `${innerIndent}<idxExternal>${s.idxExternal}</idxExternal>`,
    `${innerIndent}<IdxOperations></IdxOperations>`,
    `${innerIndent}<IdxFilters></IdxFilters>`,
    `${innerIndent}<Description>${escapeXml(m.description)}</Description>`,
    `${innerIndent}<LenBits>${m.dataLength}</LenBits>`,
    `${innerIndent}<Format>${m.format}</Format>`,
    `${innerIndent}<Bit>${m.bit}</Bit>`,
    `${innerIndent}<Address>${m.address}</Address>`,
    `${innerIndent}<ReadWrite>${m.readWrite}</ReadWrite>`,
    `${innerIndent}<StringLength>${m.stringLength}</StringLength>`,
    `${innerIndent}<SlaveIndex>-1</SlaveIndex>`,
    `${innerIndent}<GatewayIndex>-1</GatewayIndex>`,
  ];

  if (m.virtual) {
    lines.push(
      `${innerIndent}<Virtual Status="True" Fixed="${m.fixed ? 'True' : 'False'}" General="False" />`,
    );
  } else {
    lines.push(
      `${innerIndent}<Virtual Status="False" Fixed="False" General="False" />`,
    );
  }

  lines.push(`${innerIndent}<ProtocolIndex>-1</ProtocolIndex>`);
  lines.push(`${indent}</Signal>`);

  return lines.join(eol);
}

/**
 * Generate BACnet Client Object XML (for ExternalProtocol/Objects)
 * This uses <Object> elements
 */
function generateBacnetClientObjectXml(
  s: MBSBACRawSignal,
  indent: string,
  eol: string,
): string {
  const b = s.bacnetClient;
  const innerIndent = indent + '  ';

  const objectId = b.objectId >= 0 ? b.objectId : calculateObjectId(b.bacType, b.bacInstance);

  const lines = [
    `${indent}<Object ID="${s.idxExternal}">`,
    `${innerIndent}<idxConfig>${s.idxExternal}</idxConfig>`,
    `${innerIndent}<idxExternal>${s.idxExternal}</idxExternal>`,
    `${innerIndent}<IdxOperations></IdxOperations>`,
    `${innerIndent}<IdxFilters></IdxFilters>`,
    `${innerIndent}<BACType>${b.bacType}</BACType>`,
    `${innerIndent}<BACInstance>${b.bacInstance}</BACInstance>`,
    `${innerIndent}<ObjectID>${objectId}</ObjectID>`,
    `${innerIndent}<DeviceIndex>${b.deviceIndex}</DeviceIndex>`,
    `${innerIndent}<Param>0</Param>`,
    `${innerIndent}<Active>${b.active ? 'True' : 'False'}</Active>`,
  ];

  if (b.virtual) {
    lines.push(
      `${innerIndent}<Virtual Status="True" Fixed="${b.fixed ? 'True' : 'False'}" General="False" />`,
    );
  } else {
    lines.push(
      `${innerIndent}<Virtual Status="False" Fixed="False" General="False" />`,
    );
  }

  lines.push(`${indent}</Object>`);

  return lines.join(eol);
}

/**
 * Generate BACnet Device XML (for ExternalProtocol/BACnetDevices)
 */
function generateBacnetDeviceXml(
  d: BACnetClientDevice,
  indent: string,
): string {
  return `${indent}<BACnetDevice Index="${d.index}" Enabled="${d.enabled ? 'True' : 'False'}" Name="${escapeXml(d.name)}" RecType="0" NetNumber="0" MSTPAddress="0" OtherAddress="ff" ObjInstance="${d.objInstance}" Ip="${d.ip}" Port="${d.port}" ReadType="0" WritePriority="0" ReadProperty="85" EnableRDPVSpec="False" LifeTime="30" KeepAlive="1" TimeInterFrame="0" />`;
}
