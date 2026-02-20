import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  SignalLibraryRecord,
  SignalInputType,
} from '@/types/signal-library';
import type { EditableRow } from '@/types/overrides';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UseSignalLibraryParams {
  open: boolean;
  inputType: SignalInputType;
  onLoad: (record: SignalLibraryRecord) => void;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSignalLibrary({
  open,
  inputType,
  onLoad,
  onOpenChange,
}: UseSignalLibraryParams) {
  const [records, setRecords] = useState<SignalLibraryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inline delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit dialog
  const [editRecord, setEditRecord] = useState<SignalLibraryRecord | null>(
    null,
  );

  // ------ API calls ------

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ inputType });
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/signal-library?${params}`);
      if (!res.ok) throw new Error('Failed to fetch library');

      const data = await res.json();
      setRecords(data.records ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading library');
    } finally {
      setLoading(false);
    }
  }, [inputType, search]);

  useEffect(() => {
    if (open) {
      fetchRecords();
      setSelectedId(null);
      setConfirmDeleteId(null);
    }
  }, [open, fetchRecords]);

  // ------ Derived data ------

  const selectedRecord = records.find((r) => r.id === selectedId) ?? null;

  const previewData: EditableRow[] = useMemo(() => {
    if (!selectedRecord) return [];

    return selectedRecord.signals.map((sig, i) => {
      let type = '—';
      let address: string | number = '—';

      if ('objectType' in sig) {
        type = sig.objectType;
        address = sig.instance;
      } else if ('registerType' in sig) {
        type = sig.registerType;
        address = sig.address;
      } else if ('dpt' in sig) {
        type = sig.dpt;
        address = 'groupAddress' in sig ? sig.groupAddress : '—';
      }

      return {
        id: `lib-${i}`,
        Name: sig.signalName,
        Type: type,
        Address: String(address),
        Units: 'units' in sig ? (sig.units ?? '—') : '—',
      };
    });
  }, [selectedRecord]);

  // ------ Handlers ------

  const handleLoad = useCallback(() => {
    if (selectedRecord) {
      onLoad(selectedRecord);
      onOpenChange(false);
    }
  }, [selectedRecord, onLoad, onOpenChange]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        fetchRecords();
      }
    },
    [fetchRecords],
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeleting(true);
      try {
        const res = await fetch(`/api/signal-library?id=${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete');

        setRecords((prev) => prev.filter((r) => r.id !== id));
        if (selectedId === id) setSelectedId(null);
        setConfirmDeleteId(null);
      } catch {
        setError('Failed to delete record');
      } finally {
        setDeleting(false);
      }
    },
    [selectedId],
  );

  // ------ Public API ------

  return {
    // Data
    records,
    loading,
    error,
    search,
    setSearch,
    selectedRecord,
    previewData,

    // Selection
    selectedId,
    handleToggleSelect,

    // Delete
    confirmDeleteId,
    setConfirmDeleteId,
    deleting,
    handleDelete,

    // Edit
    editRecord,
    setEditRecord,
    fetchRecords,

    // Actions
    handleLoad,
    handleSearchKeyDown,
  } as const;
}
