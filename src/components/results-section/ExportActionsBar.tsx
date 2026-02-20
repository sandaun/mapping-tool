import { Button } from '@/components/ui/button';

interface ExportActionsBarProps {
  busy: boolean;
  hasOriginalIbmaps: boolean;
  hasPendingExport: boolean;
  onPreview: () => void;
  onExport: () => void;
  onExportIbmaps: () => void;
  onReset: () => void;
}

export function ExportActionsBar({
  busy,
  hasOriginalIbmaps,
  hasPendingExport,
  onPreview,
  onExport,
  onExportIbmaps,
  onReset,
}: ExportActionsBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={onPreview}
        variant="neutral"
        disabled={busy}
        className="text-xs"
      >
        Preview &amp; Edit Signals
      </Button>
      <Button
        onClick={onExport}
        disabled={busy}
        variant="secondary-action"
        className="text-xs"
      >
        Export Template
      </Button>
      {hasOriginalIbmaps && (
        <Button
          onClick={onExportIbmaps}
          disabled={busy}
          variant="primary-action"
          className="text-xs"
        >
          Export IBMAPS
        </Button>
      )}

      {/* Spacer to push reset to the right */}
      <div className="flex-1" />

      {/* Reset button - only show when there are pending signals */}
      {hasPendingExport && (
        <Button
          onClick={onReset}
          disabled={busy}
          variant="danger"
          className="text-xs"
        >
          Reset Signals
        </Button>
      )}
    </div>
  );
}
