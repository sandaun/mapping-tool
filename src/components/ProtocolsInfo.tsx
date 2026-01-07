import type { ProtocolsMetadata } from '@/types/page.types';

type ProtocolsInfoProps = {
  protocols: ProtocolsMetadata | null;
};

export function ProtocolsInfo({ protocols }: ProtocolsInfoProps) {
  if (!protocols) return null;

  return (
    <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm">
      <div className="font-medium">Protocols detectats:</div>
      <div className="mt-2 space-y-1 text-zinc-700">
        <div>
          <span className="font-medium">Signals!B4 (Internal):</span>{' '}
          {protocols.internalProtocol ?? '—'}
        </div>
        <div>
          <span className="font-medium">Signals!B5 (External):</span>{' '}
          {protocols.externalProtocol ?? '—'}
        </div>
      </div>
    </div>
  );
}
