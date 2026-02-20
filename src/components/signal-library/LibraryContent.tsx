import { Loader2 } from 'lucide-react';
import { EditableTable } from '@/components/EditableTable';
import type { SignalLibraryRecord } from '@/types/signal-library';
import type { EditableRow } from '@/types/overrides';
import { LibraryRecordCard } from './LibraryRecordCard';

interface LibraryContentProps {
  loading: boolean;
  error: string | null;
  inputType: string;
  records: SignalLibraryRecord[];
  selectedId: string | null;
  selectedRecord: SignalLibraryRecord | null;
  previewData: EditableRow[];
  confirmDeleteId: string | null;
  deleting: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (record: SignalLibraryRecord) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}

export function LibraryContent({
  loading,
  error,
  inputType,
  records,
  selectedId,
  selectedRecord,
  previewData,
  confirmDeleteId,
  deleting,
  onToggleSelect,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: LibraryContentProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-sm text-red-500">{error}</div>;
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No {inputType} records found in the library.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {records.map((record) => (
          <LibraryRecordCard
            key={record.id}
            record={record}
            isSelected={selectedId === record.id}
            isConfirmingDelete={confirmDeleteId === record.id}
            deleting={deleting}
            onSelect={onToggleSelect}
            onEdit={onEdit}
            onRequestDelete={onRequestDelete}
            onConfirmDelete={onConfirmDelete}
            onCancelDelete={onCancelDelete}
          />
        ))}
      </div>

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
    </>
  );
}
