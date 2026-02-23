import { useState } from 'react';
import type { EditableRow, Override } from '@/types/overrides';

export type SignalsPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signals: EditableRow[];
  overrides: Override[];
  onDelete: (signalId: string) => void;
  onDeleteMany: (signalIds: string[]) => void;
  onReset: () => void;
};

export function useSignalsPreview({
  onOpenChange,
  signals,
  overrides,
  onDeleteMany,
}: SignalsPreviewDialogProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);

  const deletedCount = overrides.filter((o) => o.type === 'delete').length;
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

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedSignalIds([]);
  };

  return {
    selectMode,
    selectedSignalIds,
    setSelectedSignalIds,
    deletedCount,
    totalSignals,
    handleDeleteSelected,
    handleOpenChange,
    toggleSelectMode,
  };
}
