import type { ParsedProtocol, ParsedBridge } from '@/types/page.types';
import { PROTOCOL_NAMES, PROTOCOL_ROLES } from '@/constants/protocols';

export function parseProtocolPart(part: string): ParsedProtocol {
  const name = PROTOCOL_NAMES.find((p) => part.includes(p)) ?? part.trim();
  const role = PROTOCOL_ROLES.find((r) => part.includes(r)) ?? null;
  return { name, role };
}

/** Parse "BACnet Server → Modbus Master" into structured internal/external data. */
export function parseTemplateLabel(label: string): ParsedBridge {
  const [leftPart = '', rightPart = ''] = label.split(' → ');
  return {
    internal: parseProtocolPart(leftPart),
    external: parseProtocolPart(rightPart),
  };
}
