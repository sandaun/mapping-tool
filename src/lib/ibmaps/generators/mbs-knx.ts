import type { MBSKNXRawSignal } from '../types';

/**
 * Adds new signals to an existing IBMAPS XML string for MBS-KNX template.
 * Injects both Modbus Slave <Signal> (under InternalProtocol/Signals) and
 * <KNXObject> (under ExternalProtocol).
 *
 * @param templateXmlText The original XML content
 * @param newSignals The list of new MBSKNXRawSignals to append
 * @returns The modified XML string
 */
export function addSignals_MBS_KNX(
  templateXmlText: string,
  newSignals: MBSKNXRawSignal[],
): string {
  if (newSignals.length === 0) {
    return templateXmlText;
  }

  // Detect indentation/eol style from the file
  const eol = templateXmlText.includes('\r\n') ? '\r\n' : '\n';

  let result = templateXmlText;

  // 1. Inject Modbus Slave Signals (InternalProtocol side)
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

/**
 * Generate Modbus Slave Signal XML
 */
function generateModbusSlaveSignalXml(
  s: MBSKNXRawSignal,
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
 * Generate KNX Object XML
 */
function generateKnxObjectXml(
  s: MBSKNXRawSignal,
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

  // Handle ListeningAddresses (Additional Addresses)
  if (k.additionalAddresses) {
    const addresses = k.additionalAddresses.split(',').map((a) => a.trim());
    if (addresses.length > 0 && addresses[0] !== '') {
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

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
