import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditableTable } from "@/components/EditableTable";
import type { EditableRow, Override } from "@/types/overrides";
import { useState } from "react";

type SignalsPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signals: EditableRow[];
  overrides: Override[];
  onDelete: (signalId: string) => void;
  onDeleteMany: (signalIds: string[]) => void;
  onReset: () => void;
};

export function SignalsPreviewDialog({
  open,
  onOpenChange,
  signals,
  overrides,
  onDelete,
  onDeleteMany,
  onReset,
}: SignalsPreviewDialogProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);

  const deletedCount = overrides.filter((o) => o.type === "delete").length;
  const totalSignals = signals.length;

  const handleDeleteSelected = () => {
    if (selectedSignalIds.length === 0) return;
    onDeleteMany(selectedSignalIds);
    setSelectedSignalIds([]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectMode(false);
      setSelectedSignalIds([]);
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] flex flex-col border-slate-400 dark:border-slate-600">
        <DialogHeader>
          <DialogTitle>Generated Signals</DialogTitle>
          <DialogDescription>
            {totalSignals} signal{totalSignals !== 1 ? "s" : ""} ready to export
            {deletedCount > 0 && ` (${deletedCount} marked for deletion)`}
            {selectMode && selectedSignalIds.length > 0
              ? ` • ${selectedSignalIds.length} selected`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-md border-slate-400 dark:border-slate-600">
          <EditableTable
            data={signals}
            onDelete={onDelete}
            enableSelection={selectMode}
            selectedRowIds={selectedSignalIds}
            onSelectedRowIdsChange={setSelectedSignalIds}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="neutral"
            className="text-xs"
            onClick={() => {
              setSelectMode((prev) => !prev);
              setSelectedSignalIds([]);
            }}
          >
            {selectMode ? "Exit Select" : "Select"}
          </Button>
          {selectMode && (
            <Button
              variant="danger"
              className="text-xs"
              onClick={handleDeleteSelected}
              disabled={selectedSignalIds.length === 0}
            >
              Delete selected ({selectedSignalIds.length})
            </Button>
          )}
          {overrides.length > 0 && (
            <Button variant="danger" className="text-xs" onClick={onReset}>
              Reset Changes ({overrides.length})
            </Button>
          )}
          <Button
            variant="neutral"
            className="text-xs"
            onClick={() => handleOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
