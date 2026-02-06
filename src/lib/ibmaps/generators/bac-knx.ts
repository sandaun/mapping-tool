import type { BACKNXRawSignal } from '../types';

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
 * Adds new signals to an existing IN-BAC-KNX.ibmaps XML string.
 * Injects both <BACnetObject> nodes (InternalProtocol) and <KNXObject> nodes (ExternalProtocol).
 *
 * @param templateXmlText The original XML content
 * @param newSignals The list of new BACKNXRawSignals to append
 * @returns The modified XML string
 */
export function addKNXSignals_BAC_KNX(
  templateXmlText: string,
  newSignals: BACKNXRawSignal[],
): string {
  if (newSignals.length === 0) {
    return templateXmlText;
  }

  // Detect indentation/eol style from the file
  const eol = templateXmlText.includes('\r\n') ? '\r\n' : '\n';

  let result = templateXmlText;

  // 1. Inject BACnet Objects (InternalProtocol side)
  const internalProtocolEndTag = '</InternalProtocol>';
  const internalEndIdx = result.indexOf(internalProtocolEndTag);
  if (internalEndIdx !== -1) {
    const bacIndent = deriveIndent(result, internalEndIdx) + '  ';
    const bacObjXml = newSignals
      .map((s) => generateBacnetObjectXml(s, bacIndent, eol))
      .join(eol);

    result = insertAfterLastNewlineBefore(
      result,
      internalEndIdx,
      `${bacObjXml}${eol}`,
    );
  }

  // 2. Inject KNX Objects (ExternalProtocol side)
  const externalProtocolEndTag = '</ExternalProtocol>';
  const externalEndIdx = result.indexOf(externalProtocolEndTag);
  if (externalEndIdx !== -1) {
    const knxIndent = deriveIndent(result, externalEndIdx) + '  ';
    const knxObjXml = newSignals
      .map((s) => generateKnxObjectXml(s, knxIndent, eol))
      .join(eol);

    result = insertAfterLastNewlineBefore(
      result,
      externalEndIdx,
      `${knxObjXml}${eol}`,
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
 * Determine default relinquish value based on BACnet type
 * Output types (AO, BO, MO) get 0 or 1, others get -1
 */
function getDefaultRelinquish(type: number): number {
  // AO=1, BO=4, MO=14 are output types
  if (type === 1 || type === 4) return 0;
  if (type === 14) return 1;
  return -1;
}

/**
 * Determine default NumOfStates based on BACnet type
 */
function getDefaultNumOfStates(type: number): number {
  // Binary types (BI, BO, BV) get 2
  if (type === 3 || type === 4 || type === 5) return 2;
  // Multistate types get large value
  if (type === 13 || type === 14 || type === 19) return 65535;
  return -1;
}

/**
 * Determine default COV based on BACnet type
 */
function getDefaultCov(type: number): number {
  // Analog types have COV
  if (type === 0 || type === 1 || type === 2) return 0;
  return -1;
}

function generateBacnetObjectXml(
  s: BACKNXRawSignal,
  indent: string,
  eol: string,
): string {
  const b = s.bacnet;
  const innerIndent = indent + '  ';

  const objectId = b.objectId >= 0 ? b.objectId : calculateObjectId(b.type, b.instance);
  const relinquish = b.relinquish ?? getDefaultRelinquish(b.type);
  const numOfStates = b.numOfStates ?? getDefaultNumOfStates(b.type);
  const cov = b.cov ?? getDefaultCov(b.type);
  const units = b.units ?? (b.type <= 2 ? 95 : -1); // Analog types default to 95 (no-units)

  const lines = [
    `${indent}<BACnetObject ID="${s.idxExternal}">`,
    `${innerIndent}<BACName>${escapeXml(b.bacName)}</BACName>`,
    `${innerIndent}<Description>${escapeXml(b.description || '')}</Description>`,
    `${innerIndent}<BACType>${b.type}</BACType>`,
    `${innerIndent}<BACInstance>${b.instance}</BACInstance>`,
    `${innerIndent}<ObjectID>${objectId}</ObjectID>`,
    `${innerIndent}<Polarity>${b.polarity ? 'True' : 'False'}</Polarity>`,
    `${innerIndent}<LUT>${b.lut ?? -1}</LUT>`,
    `${innerIndent}<MAP>-1</MAP>`,
    `${innerIndent}<idxConfig>${s.idxExternal}</idxConfig>`,
    `${innerIndent}<idxExternal>${s.idxExternal}</idxExternal>`,
    `${innerIndent}<IdxOperations></IdxOperations>`,
    `${innerIndent}<IdxFilters></IdxFilters>`,
    `${innerIndent}<Active>${b.active ? 'True' : 'False'}</Active>`,
    `${innerIndent}<Units Value="${units}" />`,
    `${innerIndent}<COV>${cov}</COV>`,
    `${innerIndent}<Relinquish>${relinquish}</Relinquish>`,
    `${innerIndent}<NumOfStates>${numOfStates}</NumOfStates>`,
    `${innerIndent}<NotificationClass Id="-1" AlarmNotify="False" TimeDelay="0" EventEnable="224" HighLimit="0" LowLimit="0" HighLimitEnabled="False" LowLimitEnabled="False" DeadBand="0" AlarmValueActive="False" AlarmValuesId="0" FaultValuesId="0" AlarmValues="" FaultValues="" FeedbackValue="0" HighLimitLav="0" LowLimitLav="0" DeadBandLav="0" />`,
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

  lines.push(`${innerIndent}<ProtocolIndex>-1</ProtocolIndex>`);
  lines.push(`${indent}</BACnetObject>`);

  return lines.join(eol);
}

function generateKnxObjectXml(
  s: BACKNXRawSignal,
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
 * Parse Group Address string to numeric value
 * "0/0/1" -> 1, "1/2/3" -> 2563
 */
function parseGroupAddressValue(groupAddress: string): number {
  const parts = groupAddress.split('/').map((p) => parseInt(p.trim(), 10));
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [main, middle, sub] = parts;
  return (main << 11) | (middle << 8) | sub;
}
