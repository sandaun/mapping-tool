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
import type { EditableRow, Override } from '@/types/overrides';

type SignalsPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signals: EditableRow[];
  overrides: Override[];
  onDelete: (signalId: string) => void;
  onReset: () => void;
  onExport: () => void;
};

export function SignalsPreviewDialog({
  open,
  onOpenChange,
  signals,
  overrides,
  onDelete,
  onReset,
  onExport,
}: SignalsPreviewDialogProps) {
  const deletedCount = overrides.filter((o) => o.type === 'delete').length;
  const totalSignals = signals.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] flex flex-col border-slate-400 dark:border-slate-600">
        <DialogHeader>
          <DialogTitle>Generated Signals</DialogTitle>
          <DialogDescription>
            {totalSignals} signal{totalSignals !== 1 ? 's' : ''} ready to export
            {deletedCount > 0 && ` (${deletedCount} marked for deletion)`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-md border-slate-400 dark:border-slate-600">
          <EditableTable
            data={signals}
            onEdit={() => {}} // Not used since editing is disabled
            onDelete={onDelete}
          />
        </div>

        <DialogFooter className="gap-2">
          {overrides.length > 0 && (
            <Button
              variant="outline"
              className="text-xs text-red-400 border-red-400 bg-red-400/10 hover:text-red-400 hover:bg-red-400/15 dark:bg-red-400/15 dark:hover:border-red-400 dark:hover:bg-red-400/15"
              onClick={onReset}
            >
              Reset Changes ({overrides.length})
            </Button>
          )}
          <Button
            variant="outline"
            className="text-slate-500 border-slate-500 hover:text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:border-slate-600 font-semibold text-xs hover:dark:border-slate-300 hover:dark:text-slate-300"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={onExport}
            variant="outline"
            className="border-secondary bg-secondary/10 text-xs text-secondary hover:border-secondary/60 hover:bg-secondary/15 hover:text-secondary dark:bg-secondary/15 dark:hover:bg-secondary/20"
          >
            Export Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
