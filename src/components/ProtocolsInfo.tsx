import type { ProtocolsMetadata } from '@/types/page.types';
import { Badge } from '@/components/ui/badge';

type ProtocolsInfoProps = {
  protocols: ProtocolsMetadata | null;
};

function extractProtocolName(fullName: string | null | undefined): string {
  if (!fullName) return '—';

  // Extract clean protocol name (e.g., "SignalsIB4_MB" → "Modbus RTU")
  if (fullName.includes('BACnet')) return 'BACnet';
  if (fullName.includes('Modbus') || fullName.includes('MB')) return 'Modbus';
  if (fullName.includes('KNX')) return 'KNX';

  return fullName;
}

export function ProtocolsInfo({ protocols }: ProtocolsInfoProps) {
  if (!protocols) return null;

  const internalName = extractProtocolName(protocols.internalProtocol);
  const externalName = extractProtocolName(protocols.externalProtocol);

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
      <div className="mb-3 text-sm font-semibold text-muted-foreground">
        PROTOCOL ARCHITECTURE
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Internal (Master):</span>
          <Badge variant="default" className="font-semibold">
            {internalName}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">External (Client):</span>
          <Badge variant="secondary" className="font-semibold">
            {externalName}
          </Badge>
        </div>
      </div>
    </div>
  );
}
