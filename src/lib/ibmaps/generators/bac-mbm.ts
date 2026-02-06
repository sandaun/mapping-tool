import type { RawSignal, IbmapsDevice } from '../types';

/**
 * Adds new Modbus signals (and their BACnet counterparts) to an existing IBMAPS XML string.
 * Also injects any required devices if they don't exist in the base file.
 *
 * @param templateXmlText The original XML content
 * @param newSignals The list of new RawSignals to append
 * @param newDevices Optional list of new Devices to append if referenced by signals
 * @returns The modified XML string
 */
export function addModbusSignals_BAC_MBM(
  templateXmlText: string,
  newSignals: RawSignal[],
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

  // 2. Inject Signals
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

  // 3. Inject BACnet Objects
  const internalProtocolEndTag = '</InternalProtocol>';
  const internalEndIdx = result.indexOf(internalProtocolEndTag);
  if (internalEndIdx !== -1 && newSignals.length > 0) {
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

function generateSignalXml(s: RawSignal, indent: string, eol: string): string {
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
    `${innerIndent}<Format>${m.format ?? m.regType ?? 99}</Format>`,
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

function generateBacnetObjectXml(
  s: RawSignal,
  indent: string,
  eol: string,
): string {
  const b = s.bacnet;
  const innerIndent = indent + '  ';

  const lines = [
    `${indent}<BACnetObject ID="${s.idxExternal}">`,
    `${innerIndent}<BACName>${b.bacName}</BACName>`,
    `${innerIndent}<Description></Description>`,
    `${innerIndent}<BACType>${b.type}</BACType>`,
    `${innerIndent}<BACInstance>${b.instance}</BACInstance>`,
    `${innerIndent}<ObjectID>0</ObjectID>`,
    `${innerIndent}<Polarity>False</Polarity>`,
    `${innerIndent}<LUT>-1</LUT>`,
    `${innerIndent}<MAP>-1</MAP>`,
    `${innerIndent}<idxConfig>${s.idxExternal}</idxConfig>`,
    `${innerIndent}<idxExternal>${s.idxExternal}</idxExternal>`,
    `${innerIndent}<IdxOperations></IdxOperations>`,
    `${innerIndent}<IdxFilters></IdxFilters>`,
    `${innerIndent}<Active>True</Active>`,
    `${innerIndent}<Units Value="${b.units ?? -1}" />`,
    `${innerIndent}<COV>-1</COV>`,
    `${innerIndent}<Relinquish>-1</Relinquish>`,
    `${innerIndent}<NumOfStates>-1</NumOfStates>`,
    `${innerIndent}<NotificationClass Id="-1" AlarmNotify="False" TimeDelay="0" EventEnable="0" HighLimit="0" LowLimit="0" HighLimitEnabled="False" LowLimitEnabled="False" DeadBand="0" AlarmValueActive="False" AlarmValuesId="0" FaultValuesId="0" AlarmValues="" FaultValues="" FeedbackValue="1" HighLimitLav="0" LowLimitLav="0" DeadBandLav="0" />`,
  ];

  if (s.modbus.virtual) {
    lines.push(
      `${innerIndent}<Virtual Status="True" Fixed="True" General="False" />`,
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
