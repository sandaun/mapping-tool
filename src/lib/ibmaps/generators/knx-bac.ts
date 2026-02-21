import type { KNXBACRawSignal, BACnetClientDevice } from '../types';

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
 * Adds new signals to an existing IN-KNX-BAC.ibmaps XML string.
 * Injects both <KNXObject> nodes (InternalProtocol) and <Object> nodes (ExternalProtocol/Objects).
 * Optionally injects new <BACnetDevice> nodes if needed.
 *
 * @param templateXmlText The original XML content
 * @param newSignals The list of new KNXBACRawSignals to append
 * @param newDevices Optional list of new BACnet devices to append
 * @returns The modified XML string
 */
export function addSignals_KNX_BAC(
  templateXmlText: string,
  newSignals: KNXBACRawSignal[],
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

  // 1. Inject KNX Objects (InternalProtocol side)
  const internalProtocolEndTag = '</InternalProtocol>';
  const internalEndIdx = result.indexOf(internalProtocolEndTag);
  if (internalEndIdx !== -1) {
    const knxIndent = deriveIndent(result, internalEndIdx) + '  ';
    const knxObjXml = newSignals
      .map((s) => generateKnxObjectXml(s, knxIndent, eol))
      .join(eol);

    result = insertAfterLastNewlineBefore(
      result,
      internalEndIdx,
      `${knxObjXml}${eol}`,
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
 * Parse Group Address string to numeric value
 * "0/0/1" -> 1, "1/2/3" -> 2563
 */
function parseGroupAddressValue(groupAddress: string): number {
  const parts = groupAddress.split('/').map((p) => parseInt(p.trim(), 10));
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [main, middle, sub] = parts;
  return (main << 11) | (middle << 8) | sub;
}

/**
 * Generate KNX Object XML (for InternalProtocol)
 */
function generateKnxObjectXml(
  s: KNXBACRawSignal,
  indent: string,
  eol: string,
): string {
  const k = s.knx;
  const innerIndent = indent + '  ';

  const lines = [
    `${indent}<KNXObject ID="${s.idxExternal}">`,
    `${innerIndent}<Description>${escapeXml(k.description)}</Description>`,
    `${innerIndent}<Active>${k.active ? 'True' : 'False'}</Active>`,
    `${innerIndent}<AllowedValues></AllowedValues>`,
    `${innerIndent}<DPT Value="${k.dptValue}" />`,
    `${innerIndent}<SendingAddress Value="${k.groupAddressValue}" String="${k.groupAddress}" />`,
  ];

  // ListeningAddresses (Additional Addresses)
  if (k.additionalAddresses) {
    const addresses = k.additionalAddresses.split(',').map((a) => a.trim());
    if (addresses.length > 0 && addresses[0]) {
      lines.push(`${innerIndent}<ListeningAddresses>`);
      for (const addr of addresses) {
        const addrValue = parseGroupAddressValue(addr);
        lines.push(
          `${innerIndent}  <Address Value="${addrValue}" String="${addr}" />`,
        );
      }
      lines.push(`${innerIndent}</ListeningAddresses>`);
    } else {
      lines.push(`${innerIndent}<ListeningAddresses />`);
    }
  } else {
    lines.push(`${innerIndent}<ListeningAddresses />`);
  }

  lines.push(
    `${innerIndent}<Flags U="${k.flags.u ? 'True' : 'False'}" T="${k.flags.t ? 'True' : 'False'}" Ri="${k.flags.ri ? 'True' : 'False'}" W="${k.flags.w ? 'True' : 'False'}" R="${k.flags.r ? 'True' : 'False'}" />`,
  );
  lines.push(`${innerIndent}<Priority>${k.priority}</Priority>`);
  lines.push(`${innerIndent}<UpdateGA>0</UpdateGA>`);
  lines.push(`${innerIndent}<IdxExternal>${s.idxExternal}</IdxExternal>`);
  lines.push(`${innerIndent}<IdxConfig>${s.idxExternal}</IdxConfig>`);
  lines.push(`${innerIndent}<IdxOperations></IdxOperations>`);
  lines.push(`${innerIndent}<IdxFilters></IdxFilters>`);

  if (k.virtual) {
    lines.push(
      `${innerIndent}<Virtual Status="True" Fixed="${k.fixed ? 'True' : 'False'}" General="False" />`,
    );
  } else {
    lines.push(
      `${innerIndent}<Virtual Status="False" Fixed="False" General="False" />`,
    );
  }

  lines.push(`${innerIndent}<ProtocolIndex>-1</ProtocolIndex>`);
  lines.push(`${indent}</KNXObject>`);

  return lines.join(eol);
}

/**
 * Generate BACnet Client Object XML (for ExternalProtocol/Objects)
 * This uses <Object> elements instead of <BACnetObject>
 */
function generateBacnetClientObjectXml(
  s: KNXBACRawSignal,
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
