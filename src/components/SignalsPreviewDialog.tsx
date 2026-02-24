import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EditableTable } from '@/components/EditableTable';
import {
  useSignalsPreview,
  type SignalsPreviewDialogProps,
} from '@/hooks/useSignalsPreview';
import { CheckSquare, Trash2, RotateCcw, X } from 'lucide-react';

export function SignalsPreviewDialog(props: SignalsPreviewDialogProps) {
  const state = useSignalsPreview(props);

  return (
    <Dialog open={props.open} onOpenChange={state.handleOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] flex flex-col border-slate-400 dark:border-slate-600">
        <DialogHeader>
          <DialogTitle>Generated Signals</DialogTitle>
          <DialogDescription>
            {state.totalSignals} signal{state.totalSignals !== 1 ? 's' : ''}{' '}
            ready to export
            {state.deletedCount > 0 &&
              ` (${state.deletedCount} marked for deletion)`}
            {state.selectMode && state.selectedSignalIds.length > 0
              ? ` • ${state.selectedSignalIds.length} selected`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg border-slate-400 dark:border-slate-600">
          <EditableTable
            data={props.signals}
            onDelete={props.onDelete}
            enableSelection={state.selectMode}
            selectedRowIds={state.selectedSignalIds}
            onSelectedRowIdsChange={state.setSelectedSignalIds}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="neutral"
            className="text-xs"
            onClick={state.toggleSelectMode}
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
            {state.selectMode ? 'Exit Select' : 'Select'}
          </Button>
          {state.selectMode && (
            <Button
              variant="danger"
              className="text-xs"
              onClick={state.handleDeleteSelected}
              disabled={state.selectedSignalIds.length === 0}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete selected ({state.selectedSignalIds.length})
            </Button>
          )}
          {props.overrides.length > 0 && (
            <Button
              variant="danger"
              className="text-xs"
              onClick={props.onReset}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset Changes ({props.overrides.length})
            </Button>
          )}
          <Button
            variant="neutral"
            className="text-xs"
            onClick={() => state.handleOpenChange(false)}
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
