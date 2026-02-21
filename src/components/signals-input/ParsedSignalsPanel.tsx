import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditableTable } from '@/components/EditableTable';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { Check, Zap } from 'lucide-react';
import type { EditableRow } from '@/types/overrides';

interface ParsedSignalsPanelProps {
  signalsCount: number;
  signalsTableData: EditableRow[];
  deviceCount: number;
  onDeviceCountChange: (count: number) => void;
  isKNXFlow: boolean;
  canClear: boolean;
  busy: boolean;
  onGenerate: () => void;
  onClear: () => void;
}

export function ParsedSignalsPanel({
  signalsCount,
  signalsTableData,
  deviceCount,
  onDeviceCountChange,
  isKNXFlow,
  canClear,
  busy,
  onGenerate,
  onClear,
}: ParsedSignalsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Auto-scroll into view when signals first appear (0 → N)
  useEffect(() => {
    const wasEmpty = prevCountRef.current === 0;
    prevCountRef.current = signalsCount;

    if (wasEmpty && signalsCount > 0 && panelRef.current) {
      // Small delay to let the DOM render before scrolling
      const timer = setTimeout(() => {
        panelRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [signalsCount]);

  if (signalsCount === 0) return null;

  return (
    <div
      ref={panelRef}
      className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-secondary bg-transparent text-secondary"
          >
            <Check className="w-3 h-3 mr-1" />
            PARSED
          </Badge>
          <span className="text-sm font-medium text-foreground">
            {signalsCount} signals ready
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isKNXFlow && (
            <NumberStepper
              value={deviceCount}
              onChange={onDeviceCountChange}
              label="Devices"
              min={1}
              max={99}
            />
          )}
          <Button
            onClick={onGenerate}
            disabled={busy}
            variant="primary-action"
            size="sm"
          >
            <Zap className="w-3.5 h-3.5" />
            Accept &amp; Generate
          </Button>
          <Button
            onClick={onClear}
            disabled={!canClear || busy}
            variant="neutral"
            size="sm"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="max-h-64 overflow-auto">
        <EditableTable data={signalsTableData} />
      </div>
    </div>
  );
}
