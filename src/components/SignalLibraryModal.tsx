'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditableTable } from './EditableTable';
import { SaveToLibraryDialog } from './SaveToLibraryDialog';
import {
  Loader2,
  Search,
  Library,
  Download,
  Pencil,
  Trash2,
} from 'lucide-react';
import type {
  SignalLibraryRecord,
  SignalInputType,
} from '@/types/signal-library';
import type { EditableRow } from '@/types/overrides';

type SignalLibraryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputType: SignalInputType;
  onLoad: (record: SignalLibraryRecord) => void;
};

export function SignalLibraryModal({
  open,
  onOpenChange,
  inputType,
  onLoad,
}: SignalLibraryModalProps) {
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

  const selectedRecord = records.find((r) => r.id === selectedId) ?? null;

  const previewData: EditableRow[] = selectedRecord
    ? selectedRecord.signals.map((sig, i) => {
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
      })
    : [];

  const handleLoad = () => {
    if (selectedRecord) {
      onLoad(selectedRecord);
      onOpenChange(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchRecords();
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/signal-library?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');

      // Remove from local state
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (selectedId === id) setSelectedId(null);
      setConfirmDeleteId(null);
    } catch {
      setError('Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col border-slate-400 dark:border-slate-600">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library className="w-5 h-5 text-primary" />
              Signal Library
            </DialogTitle>
            <DialogDescription>
              Load previously saved {inputType.toUpperCase()} signals from the
              library.
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by manufacturer or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-sm text-red-500">
                {error}
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No {inputType} records found in the library.
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      selectedId === record.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Delete confirmation inline */}
                    {confirmDeleteId === record.id ? (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                          Delete this record?
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="neutral"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={deleting}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleDelete(record.id)}
                            disabled={deleting}
                          >
                            {deleting ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3 mr-1" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Normal record display */
                      <div
                        className="w-full text-left cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setSelectedId(
                            selectedId === record.id ? null : record.id,
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedId(
                              selectedId === record.id ? null : record.id,
                            );
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm text-foreground">
                              {record.manufacturer}
                            </span>
                            <span className="text-muted-foreground text-sm mx-1.5">
                              /
                            </span>
                            <span className="text-sm text-foreground">
                              {record.model}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">
                              {record.signals.length} signals
                            </Badge>
                            {/* Edit & Delete buttons */}
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditRecord(record);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(record.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          {record.source_file_name && (
                            <span>📄 {record.source_file_name}</span>
                          )}
                          <span>
                            {new Date(record.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Preview of selected record */}
            {selectedRecord && previewData.length > 0 && (
              <div className="mt-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Preview — {selectedRecord.signals.length} signals
                </p>
                <div className="max-h-40 overflow-auto">
                  <EditableTable data={previewData} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary-action"
              size="sm"
              onClick={handleLoad}
              disabled={!selectedRecord}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Load Signals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog — reuses SaveToLibraryDialog in edit mode */}
      {editRecord && (
        <SaveToLibraryDialog
          open={!!editRecord}
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditRecord(null);
          }}
          signals={editRecord.signals}
          inputType={editRecord.input_type}
          editRecord={editRecord}
          onSaved={fetchRecords}
        />
      )}
    </>
  );
}
