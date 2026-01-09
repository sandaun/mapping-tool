/**
 * Map BACnet object type code to full format with prefix (e.g., "AI" → "0: AI")
 */
export function formatBACnetType(objectType: string): string {
  const typeMap: Record<string, string> = {
    AI: '0: AI',
    AO: '1: AO',
    AV: '2: AV',
    BI: '3: BI',
    BO: '4: BO',
    BV: '5: BV',
    MI: '13: MI',
    MO: '14: MO',
    MV: '19: MV',
  };
  return typeMap[objectType] ?? objectType;
}
