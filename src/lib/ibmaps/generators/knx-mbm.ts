import type { KNXRawSignal, IbmapsDevice } from '../types';

/**
 * Adds new Modbus signals (and their KNX counterparts) to an existing IBMAPS XML string.
 * Also injects any required devices if they don't exist in the base file.
 *
 * @param templateXmlText The original XML content
 * @param newSignals The list of new KNXRawSignals to append
 * @param newDevices Optional list of new Devices to append if referenced by signals
 * @returns The modified XML string
 */
export function addModbusSignals_KNX_MBM(
  templateXmlText: string,
  newSignals: KNXRawSignal[],
  newDevices: IbmapsDevice[] = [],
): string {
  if (newSignals.length === 0 && newDevices.length === 0) {
    return templateXmlText;
  }

  // Detect indentation/eol style from the file
  const eol = templateXmlText.includes('\r\n') ? '\r\n' : '\n';

  let result = templateXmlText;

  // 1. Inject Devices
  if (newDevices.length > 0) {
    const rtuNodeEndIdx = result.indexOf('</RtuNode>');
    if (rtuNodeEndIdx !== -1) {
      const deviceIndent = deriveIndent(result, rtuNodeEndIdx) + '  ';
      const devicesXml = newDevices
        .map((d) => generateDeviceXml(d, deviceIndent))
        .join(eol);

      result = insertAfterLastNewlineBefore(
        result,
        rtuNodeEndIdx,
        `${devicesXml}${eol}`,
      );
    }
  }

  // 2. Inject Signals (Modbus side)
  const signalsEndTag = '</Signals>';
  const signalsEndIdx = result.lastIndexOf(signalsEndTag);
  if (signalsEndIdx !== -1 && newSignals.length > 0) {
    const signalIndent = deriveIndent(result, signalsEndIdx) + '  ';
    const signalsXml = newSignals
      .map((s) => generateSignalXml(s, signalIndent, eol))
      .join(eol);

    result = insertAfterLastNewlineBefore(
      result,
      signalsEndIdx,
      `${signalsXml}${eol}`,
    );
  }

  // 3. Inject KNX Objects (InternalProtocol side)
  const internalProtocolEndTag = '</InternalProtocol>';
  const internalEndIdx = result.indexOf(internalProtocolEndTag);
  if (internalEndIdx !== -1 && newSignals.length > 0) {
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

function generateDeviceXml(d: IbmapsDevice, indent: string): string {
  return `${indent}<Device Index="${d.index}" Name="${d.name || ''}" Manufacturer="${d.manufacturer || ''}" SlaveNum="${d.slaveNum}" BaseRegister="${d.baseRegister ?? 0}" Timeout="${d.timeout ?? 1000}" Enabled="${d.enabled !== false ? 'True' : 'False'}" />`;
}

function generateSignalXml(
  s: KNXRawSignal,
  indent: string,
  eol: string,
): string {
  const m = s.modbus;
  const innerIndent = indent + '  ';

  const lines = [
    `${indent}<Signal ID="${s.idxExternal}">`,
    `${innerIndent}<idxConfig>${s.idxExternal}</idxConfig>`,
    `${innerIndent}<idxExternal>${s.idxExternal}</idxExternal>`,
    `${innerIndent}<IdxOperations></IdxOperations>`,
    `${innerIndent}<IdxFilters></IdxFilters>`,
    `${innerIndent}<Port>0</Port>`,
    `${innerIndent}<DeviceIndex>${m.deviceIndex}</DeviceIndex>`,
    `${innerIndent}<IsBroadcast>False</IsBroadcast>`,
    `${innerIndent}<ReadFunc>${m.readFunc}</ReadFunc>`,
    `${innerIndent}<WriteFunc>${m.writeFunc}</WriteFunc>`,
    `${innerIndent}<LenBits>${m.lenBits ?? -1}</LenBits>`,
    `${innerIndent}<Format>${m.format ?? 99}</Format>`,
    `${innerIndent}<ByteOrder>${m.byteOrder ?? 255}</ByteOrder>`,
    `${innerIndent}<Bit>${m.bit ?? -1}</Bit>`,
    `${innerIndent}<NumOfBits>${m.numOfBits ?? 1}</NumOfBits>`,
    `${innerIndent}<Address>${m.address}</Address>`,
    `${innerIndent}<Deadband>${m.deadband ?? 0}</Deadband>`,
  ];

  if (m.virtual) {
    lines.push(
      `${innerIndent}<Virtual Status="True" Fixed="${m.fixed ? 'True' : 'False'}" />`,
    );
  } else {
    lines.push(`${innerIndent}<Virtual Status="False" Fixed="False" />`);
  }

  lines.push(`${indent}</Signal>`);
  return lines.join(eol);
}

function generateKnxObjectXml(
  s: KNXRawSignal,
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
    `${innerIndent}<ListeningAddresses />`,
    `${innerIndent}<Flags U="${k.flags.u ? 'True' : 'False'}" T="${k.flags.t ? 'True' : 'False'}" Ri="${k.flags.ri ? 'True' : 'False'}" W="${k.flags.w ? 'True' : 'False'}" R="${k.flags.r ? 'True' : 'False'}" />`,
    `${innerIndent}<Priority>${k.priority}</Priority>`,
    `${innerIndent}<UpdateGA>0</UpdateGA>`,
    `${innerIndent}<IdxExternal>${s.idxExternal}</IdxExternal>`,
    `${innerIndent}<IdxConfig>${s.idxExternal}</IdxConfig>`,
    `${innerIndent}<IdxOperations></IdxOperations>`,
    `${innerIndent}<IdxFilters></IdxFilters>`,
  ];

  if (k.virtual) {
    lines.push(
      `${innerIndent}<Virtual Status="True" Fixed="${k.fixed ? 'True' : 'False'}" General="False" />`,
    );
  } else {
    lines.push(
      `${innerIndent}<Virtual Status="False" Fixed="False" General="False" />`,
    );
  }

  lines.push(`${innerIndent}<ProtocolIndex>0</ProtocolIndex>`);
  lines.push(`${indent}</KNXObject>`);

  return lines.join(eol);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
