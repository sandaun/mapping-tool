'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { extractSignalsFromWorkbook } from '@/lib/overrides';
import { applyOverrides } from '@/lib/overrides';
import { SignalsPreviewDialog } from '@/components/SignalsPreviewDialog';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { Override } from '@/types/overrides';

type ResultsSectionProps = {
  raw: RawWorkbook;
  sheetNames: string[];
  onExport: (overrides: Override[]) => void;
  busy: boolean;
  pendingExport: { signalsCount: number; targetSheet: string } | null;
  templateId: string;
};

export function ResultsSection({
  raw,
  sheetNames,
  onExport,
  busy,
  pendingExport,
  templateId,
}: ResultsSectionProps) {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Extract signals from workbook
  const extractedSignals = useMemo(
    () => extractSignalsFromWorkbook(raw, templateId),
    [raw, templateId],
  );

  // Apply overrides to get displayed signals
  const displayedSignals = useMemo(
    () => applyOverrides(extractedSignals, overrides),
    [extractedSignals, overrides],
  );

  const handleDelete = (signalId: string) => {
    setOverrides((prev) => [...prev, { type: 'delete', signalId }]);
  };

  const handleReset = () => {
    setOverrides([]);
  };

  const handleExport = () => {
    onExport(overrides);
    setIsDialogOpen(false);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Generated Output</h2>
          <p className="text-sm text-muted-foreground">
            Sheets: {sheetNames.join(', ')}
          </p>
        </div>

        {pendingExport && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-950">
            {/* TODO: remove this */}
            {/* <p className="font-medium text-blue-900 dark:text-blue-100">
              Export ready
            </p> */}
            <p className="text-blue-700 dark:text-blue-300">
              {pendingExport.signalsCount} signals will be exported
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="neutral"
            disabled={busy}
            className="text-xs"
          >
            Preview & Edit Signals
          </Button>
          <Button
            onClick={handleExport}
            disabled={busy}
            variant="secondary-action"
            className="text-xs"
          >
            {busy ? 'Exporting...' : 'Export Template'}
          </Button>
        </div>
        {/* TODO: remove this */}
        {/* <details className="rounded-lg border border-border bg-muted/50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            View RAW JSON
          </summary>
          <pre className="mt-3 max-h-120 overflow-auto text-xs leading-5 text-muted-foreground">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </details> */}
      </div>

      <SignalsPreviewDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        signals={displayedSignals}
        overrides={overrides}
        onDelete={handleDelete}
        onReset={handleReset}
        onExport={handleExport}
      />
    </section>
  );
}
