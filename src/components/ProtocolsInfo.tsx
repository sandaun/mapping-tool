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

function ProtocolBadge({
  tone,
  children,
}: {
  tone: 'internal' | 'external';
  children: string;
}) {
  const toneClassName =
    tone === 'internal'
      ? 'border-primary bg-transparent text-primary'
      : 'border-secondary bg-transparent text-secondary';

  return (
    <Badge variant="outline" className={`font-semibold ${toneClassName}`}>
      {children}
    </Badge>
  );
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
          <span className="text-muted-foreground">Internal:</span>
          <ProtocolBadge tone="internal">{internalName}</ProtocolBadge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">External:</span>
          <ProtocolBadge tone="external">{externalName}</ProtocolBadge>
        </div>
      </div>
    </div>
  );
}
