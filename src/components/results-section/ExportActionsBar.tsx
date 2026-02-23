import { Button } from '@/components/ui/button';
import { Eye, RotateCcw, FileSpreadsheet, Download } from 'lucide-react';

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
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={onPreview}
        variant="neutral"
        disabled={busy}
        className="text-xs"
      >
        <Eye className="w-3.5 h-3.5 mr-1.5" />
        Preview & Edit Signals
      </Button>

      {/* Spacer to push reset and export buttons to the right */}
      <div className="flex-1" />

      {/* Reset button - only show when there are pending signals */}
      {hasPendingExport && (
        <Button
          onClick={onReset}
          disabled={busy}
          variant="danger"
          className="text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reset Signals
        </Button>
      )}

      <Button
        onClick={onExport}
        disabled={busy}
        variant="secondary-action"
        className="text-xs"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
        Export Template
      </Button>

      {hasOriginalIbmaps && (
        <Button
          onClick={onExportIbmaps}
          disabled={busy}
          variant="primary-action"
          className="text-xs"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export IBMAPS
        </Button>
      )}
    </div>
  );
}
