import type { RawSignal, IbmapsDevice } from './types';
import { parseIbmapsSignals_BAC_MBM } from './parser';

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
  newDevices: IbmapsDevice[] = []
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
      const deviceIndent = deriveIndent(result, rtuNodeEndIdx) + '  '; // Detect parent + 2 spaces
      const devicesXml = newDevices
        .map((d) => generateDeviceXml(d, deviceIndent))
        .join(eol);
      
      // Insert after the last newline before </RtuNode> to avoid double indentation
      result = insertAfterLastNewlineBefore(result, rtuNodeEndIdx, `${devicesXml}${eol}`, eol);
    }
  }

  // 2. Inject Signals
  const signalsEndTag = '</Signals>';
  // Re-evaluate index because result changed
  const signalsEndIdx = result.lastIndexOf(signalsEndTag);
  if (signalsEndIdx !== -1 && newSignals.length > 0) {
    const signalIndent = deriveIndent(result, signalsEndIdx) + '  ';
    const signalsXml = newSignals
      .map((s) => generateSignalXml(s, signalIndent, eol))
      .join(eol);
      
    // Insert after the last newline before </Signals>
    result = insertAfterLastNewlineBefore(result, signalsEndIdx, `${signalsXml}${eol}`, eol);
  }

  // 3. Inject BACnet Objects
  const internalProtocolEndTag = '</InternalProtocol>';
  // Re-evaluate index
  const internalEndIdx = result.indexOf(internalProtocolEndTag);
  if (internalEndIdx !== -1 && newSignals.length > 0) {
    const bacIndent = deriveIndent(result, internalEndIdx) + '  ';
    const bacObjXml = newSignals
      .map((s) => generateBacnetObjectXml(s, bacIndent, eol))
      .join(eol);

    // Insert after the last newline before </InternalProtocol>
    result = insertAfterLastNewlineBefore(result, internalEndIdx, `${bacObjXml}${eol}`, eol);
  }
  
  return result;
}

function insertAfterLastNewlineBefore(original: string, limitIdx: number, content: string, eol: string): string {
  // Scan backwards from limitIdx to find the first newline
  let insertPos = limitIdx;
  for (let i = limitIdx - 1; i >= 0; i--) {
    if (original[i] === '\n') {
      insertPos = i + 1;
      break;
    }
    // If we hit non-whitespace before newline, assume we are on inline tag or minified, just insert at limit
    if (original[i] !== ' ' && original[i] !== '\t' && original[i] !== '\r') {
      insertPos = limitIdx;
      // If minified/inline, we might need to prepend eol? Assuming pretty printed for now based on file.
      // But if we insert at limitIdx (right before </Tag>), and we have content `  <Tag>...`,
      // we might want to force a newline if none exists. 
      // For now, sticking to "Find indented closing tag" logic.
      break;
    }
  }
  return original.slice(0, insertPos) + content + original.slice(insertPos);
}

function deriveIndent(xml: string, index: number): string {
  // Scan backwards from index to finding newline
  let i = index - 1;
  while (i >= 0 && xml[i] !== '\n') {
    i--;
  }
  // The indentation is from i+1 to index
  // But we need to exclude non-whitespace if any (shouldn't be for closing tag line)
  const lineStart = i + 1;
  const lineStr = xml.slice(lineStart, index);
  // Match only leading whitespace
  const match = lineStr.match(/^([ \t]*)/);
  return match ? match[1] : '';
}

function generateDeviceXml(d: IbmapsDevice, indent: string): string {
  // <Device Index="0" Name="Device 0" Manufacturer="" SlaveNum="10" BaseRegister="0" Timeout="1000" Enabled="True" />
  // Careful with attribute order if strictness is required, but usually standard DOM order is Name, SlaveNum etc depending on tooling.
  // We follow standard observed order: Index, Name, Manufacturer, SlaveNum, BaseRegister, Timeout, Enabled
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
    `${innerIndent}<LenBits>-1</LenBits>`, // Standard default
    `${innerIndent}<Format>${m.regType ?? 99}</Format>`, // 99 seems to be used when undefined or specific types
    `${innerIndent}<ByteOrder>255</ByteOrder>`, // Default
    `${innerIndent}<Bit>-1</Bit>`,
    `${innerIndent}<NumOfBits>1</NumOfBits>`,
    `${innerIndent}<Address>${m.address}</Address>`,
    `${innerIndent}<Deadband>0</Deadband>`
  ];

  if (m.virtual) {
    lines.push(`${innerIndent}<Virtual Status="True" Fixed="${m.fixed ? 'True' : 'False'}" />`);
  } else {
    lines.push(`${innerIndent}<Virtual Status="False" Fixed="False" />`);
  }

  // Replicate extra unknown attributes if necessary? 
  // For now we stick to the generated structure which mimics the template.
  
  lines.push(`${indent}</Signal>`);
  return lines.join(eol);
}

function generateBacnetObjectXml(s: RawSignal, indent: string, eol: string): string {
  const b = s.bacnet;
  const innerIndent = indent + '  ';

  // ID is typically same as idxExternal in the template, but technically BACnetObject ID attribute might be just a sequence.
  // In the template Observation: <BACnetObject ID="0">...<idxExternal>0</idxExternal>
  // We'll use idxExternal for ID too for consistency.
  
  const lines = [
    `${indent}<BACnetObject ID="${s.idxExternal}">`,
    `${innerIndent}<BACName>${b.bacName}</BACName>`,
    `${innerIndent}<Description></Description>`,
    `${innerIndent}<BACType>${b.type}</BACType>`,
    `${innerIndent}<BACInstance>${b.instance}</BACInstance>`,
    `${innerIndent}<ObjectID>0</ObjectID>`, // This usually gets calculated/overwritten by MAPS, or we need logic to calc it (type << 22 | instance)
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
    `${innerIndent}<NotificationClass Id="-1" AlarmNotify="False" TimeDelay="0" EventEnable="0" HighLimit="0" LowLimit="0" HighLimitEnabled="False" LowLimitEnabled="False" DeadBand="0" AlarmValueActive="False" AlarmValuesId="0" FaultValuesId="0" AlarmValues="" FaultValues="" FeedbackValue="1" HighLimitLav="0" LowLimitLav="0" DeadBandLav="0" />`
  ];

  if (s.modbus.virtual) {
    lines.push(`${innerIndent}<Virtual Status="True" Fixed="True" General="False" />`);
  } else {
    lines.push(`${innerIndent}<Virtual Status="False" Fixed="False" General="False" />`);
  }

  lines.push(`${innerIndent}<ProtocolIndex>-1</ProtocolIndex>`);
  lines.push(`${indent}</BACnetObject>`);

  return lines.join(eol);
}
