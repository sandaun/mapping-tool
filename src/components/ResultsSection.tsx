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
    [raw, templateId]
  );

  // Apply overrides to get displayed signals
  const displayedSignals = useMemo(
    () => applyOverrides(extractedSignals, overrides),
    [extractedSignals, overrides]
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

        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <span className="font-medium">✓</span>
          <span>
            {displayedSignals.length} signal{displayedSignals.length !== 1 ? 's' : ''}{' '}
            ready to export
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
            disabled={busy}
            className="text-slate-500 border-slate-500 hover:text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:border-slate-600 font-semibold text-xs hover:dark:border-slate-300 hover:dark:text-slate-300"
          >
            Preview & Edit Signals
          </Button>
          <Button
            onClick={handleExport}
            disabled={busy}
            variant="outline"
            className="border-secondary bg-secondary/10 text-xs text-secondary hover:border-secondary/60 hover:bg-secondary/15 hover:text-secondary dark:bg-secondary/15 dark:hover:bg-secondary/20"
          >
            {busy ? 'Exporting...' : 'Export Template'}
          </Button>
        </div>

        {pendingExport && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-950">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Export ready
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              {pendingExport.signalsCount} signals will be written to{' '}
              {pendingExport.targetSheet}
            </p>
          </div>
        )}

        <details className="rounded-lg border border-border bg-muted/50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            View RAW JSON
          </summary>
          <pre className="mt-3 max-h-120 overflow-auto text-xs leading-5 text-muted-foreground">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </details>
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
