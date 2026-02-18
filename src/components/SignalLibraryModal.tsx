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
import { Loader2, Search, Library, Download } from 'lucide-react';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
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
            <div className="text-center py-8 text-sm text-red-500">{error}</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No {inputType} records found in the library.
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <button
                  key={record.id}
                  onClick={() =>
                    setSelectedId(selectedId === record.id ? null : record.id)
                  }
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selectedId === record.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {record.signals.length} signals
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        {record.input_type}
                      </Badge>
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
                </button>
              ))}
            </div>
          )}

          {/* Preview of selected record */}
          {selectedRecord && previewData.length > 0 && (
            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Preview — {selectedRecord.signals.length} signals
              </p>
              <div className="max-h-40 overflow-auto">
                <EditableTable data={previewData} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
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
  );
}
