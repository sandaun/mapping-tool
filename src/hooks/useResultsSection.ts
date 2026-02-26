import { useMemo, useState, useCallback } from 'react';
import {
  extractSignalsFromWorkbook,
  applyOverrides,
  renumberSignals,
} from '@/lib/overrides';
import { exportIbmapsFile } from '@/lib/ibmaps/export-ibmaps';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { Override } from '@/types/overrides';
import type { IbmapsState } from '@/hooks/useFileImport';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UseResultsSectionParams {
  raw: RawWorkbook;
  onExport: (overrides: Override[]) => void;
  onReset: () => void;
  busy?: boolean;
  pendingExport: { signalsCount: number; targetSheet: string } | null;
  templateId: string;
  originalIbmaps?: IbmapsState | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useResultsSection(params: UseResultsSectionParams) {
  const { raw, onExport, pendingExport, templateId, originalIbmaps } = params;

  const [overrides, setOverrides] = useState<Override[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ------ Derived data ------

  const extractedSignals = useMemo(
    () => extractSignalsFromWorkbook(raw, templateId),
    [raw, templateId],
  );

  const displayedSignals = useMemo(
    () =>
      renumberSignals(applyOverrides(extractedSignals, overrides), templateId),
    [extractedSignals, overrides, templateId],
  );

  // ------ Handlers ------

  const addDeleteOverrides = useCallback((signalIds: string[]) => {
    if (signalIds.length === 0) return;

    setOverrides((prev) => {
      const alreadyDeleted = new Set(
        prev
          .filter((override) => override.type === 'delete')
          .map((override) => override.signalId),
      );

      const uniqueNewDeletes = signalIds
        .filter((signalId) => !alreadyDeleted.has(signalId))
        .map((signalId) => ({ type: 'delete' as const, signalId }));

      if (uniqueNewDeletes.length === 0) return prev;
      return [...prev, ...uniqueNewDeletes];
    });
  }, []);

  const handleDelete = useCallback(
    (signalId: string) => addDeleteOverrides([signalId]),
    [addDeleteOverrides],
  );

  const handleDeleteMany = useCallback(
    (signalIds: string[]) => addDeleteOverrides(signalIds),
    [addDeleteOverrides],
  );

  const handleResetOverrides = useCallback(() => {
    setOverrides([]);
  }, []);

  const handleExport = useCallback(() => {
    onExport(overrides);
    setIsDialogOpen(false);
  }, [onExport, overrides]);

  const handleExportIbmaps = useCallback(() => {
    if (!originalIbmaps) return;

    try {
      exportIbmapsFile({
        templateId,
        raw,
        originalIbmaps,
        overrides,
        pendingExport,
      });
    } catch (e) {
      console.error('Export error:', e);
      alert('Error exporting IBMAPS (check console)');
    }
  }, [originalIbmaps, templateId, raw, overrides, pendingExport]);

  // ------ Public API ------

  return {
    // State
    overrides,
    isDialogOpen,
    setIsDialogOpen,

    // Derived
    displayedSignals,

    // Handlers
    handleDelete,
    handleDeleteMany,
    handleResetOverrides,
    handleExport,
    handleExportIbmaps,

    // Pass-through
    pendingExport: params.pendingExport,
    busy: params.busy ?? false,
    onReset: params.onReset,
    originalIbmaps: params.originalIbmaps,
  } as const;
}
