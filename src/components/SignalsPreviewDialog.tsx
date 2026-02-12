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
};

export function SignalsPreviewDialog({
  open,
  onOpenChange,
  signals,
  overrides,
  onDelete,
  onReset,
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
          <EditableTable data={signals} onDelete={onDelete} />
        </div>

        <DialogFooter className="gap-2">
          {overrides.length > 0 && (
            <Button variant="danger" className="text-xs" onClick={onReset}>
              Reset Changes ({overrides.length})
            </Button>
          )}
          <Button
            variant="neutral"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
