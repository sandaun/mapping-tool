'use client';

import type { RawWorkbook } from '@/lib/excel/raw';
import type { Override } from '@/types/overrides';
import type { IbmapsState } from '@/hooks/useFileImport';
import { useResultsSection } from '@/hooks/useResultsSection';
import { SignalsPreviewDialog } from '@/components/SignalsPreviewDialog';
import { PendingExportBanner } from './PendingExportBanner';
import { ExportActionsBar } from './ExportActionsBar';

// ---------------------------------------------------------------------------
// Props (public API — unchanged from the original component)
// ---------------------------------------------------------------------------

export type ResultsSectionProps = {
  raw: RawWorkbook;
  onExport: (overrides: Override[]) => void;
  onReset: () => void;
  busy?: boolean;
  pendingExport: { signalsCount: number; targetSheet: string } | null;
  templateId: string;
  originalIbmaps?: IbmapsState | null;
};

// ---------------------------------------------------------------------------
// Component (orchestrator — zero business logic)
// ---------------------------------------------------------------------------

export function ResultsSection(props: ResultsSectionProps) {
  const state = useResultsSection(props);

  return (
    <div className='space-y-4'>
      {state.pendingExport && (
        <PendingExportBanner signalsCount={state.pendingExport.signalsCount} />
      )}

      <ExportActionsBar
        busy={state.busy}
        hasOriginalIbmaps={!!state.originalIbmaps}
        hasPendingExport={!!state.pendingExport}
        onPreview={() => state.setIsDialogOpen(true)}
        onExport={state.handleExport}
        onExportIbmaps={state.handleExportIbmaps}
        onReset={state.onReset}
      />

      <SignalsPreviewDialog
        open={state.isDialogOpen}
        onOpenChange={state.setIsDialogOpen}
        signals={state.displayedSignals}
        overrides={state.overrides}
        onDelete={state.handleDelete}
        onDeleteMany={state.handleDeleteMany}
        onReset={state.handleResetOverrides}
      />
    </div>
  );
}
