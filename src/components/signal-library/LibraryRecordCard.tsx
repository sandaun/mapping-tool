import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, Pencil, Trash2 } from 'lucide-react';
import type { SignalLibraryRecord } from '@/types/signal-library';

interface LibraryRecordCardProps {
  record: SignalLibraryRecord;
  isSelected: boolean;
  isConfirmingDelete: boolean;
  deleting: boolean;
  onSelect: (id: string) => void;
  onEdit: (record: SignalLibraryRecord) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}

export function LibraryRecordCard({
  record,
  isSelected,
  isConfirmingDelete,
  deleting,
  onSelect,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: LibraryRecordCardProps) {
  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border hover:border-primary/30 hover:bg-muted/50 dark:hover:bg-slate-800/50'
      }`}
    >
      {isConfirmingDelete ? (
        <DeleteConfirmation
          deleting={deleting}
          onConfirm={() => onConfirmDelete(record.id)}
          onCancel={onCancelDelete}
        />
      ) : (
        <RecordContent
          record={record}
          onSelect={() => onSelect(record.id)}
          onEdit={() => onEdit(record)}
          onRequestDelete={() => onRequestDelete(record.id)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal sub-components
// ---------------------------------------------------------------------------

function DeleteConfirmation({
  deleting,
  onConfirm,
  onCancel,
}: {
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-red-600 dark:text-red-400 font-medium">
        Delete this record?
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="neutral"
          size="sm"
          className="text-xs h-7"
          onClick={onCancel}
          disabled={deleting}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="text-xs h-7"
          onClick={onConfirm}
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
  );
}

function RecordContent({
  record,
  onSelect,
  onEdit,
  onRequestDelete,
}: {
  record: SignalLibraryRecord;
  onSelect: () => void;
  onEdit: () => void;
  onRequestDelete: () => void;
}) {
  return (
    <div
      className="w-full text-left cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-sm text-foreground">
            {record.manufacturer}
          </span>
          <span className="text-muted-foreground text-sm mx-1.5">/</span>
          <span className="text-sm text-foreground">{record.model}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-xs">
            {record.signals.length} signals
          </Badge>
          <button
            type="button"
            className="p-1 rounded hover:bg-muted dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition-colors"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
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
              onRequestDelete();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
        {record.source_file_name && (
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {record.source_file_name}
          </span>
        )}
        <span>{new Date(record.updated_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
