'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SaveToLibraryDialog } from '@/components/SaveToLibraryDialog';
import { Library, Download } from 'lucide-react';
import type {
  SignalLibraryRecord,
  SignalInputType,
} from '@/types/signal-library';
import { useSignalLibrary } from '@/hooks/useSignalLibrary';
import { LibrarySearchBar } from './LibrarySearchBar';
import { LibraryContent } from './LibraryContent';

// ---------------------------------------------------------------------------
// Props (public API — unchanged from the original component)
// ---------------------------------------------------------------------------

export type SignalLibraryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputType: SignalInputType;
  onLoad: (record: SignalLibraryRecord) => void;
};

// ---------------------------------------------------------------------------
// Component (orchestrator — zero business logic)
// ---------------------------------------------------------------------------

export function SignalLibraryModal(props: SignalLibraryModalProps) {
  const { open, onOpenChange, inputType } = props;
  const state = useSignalLibrary(props);

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
          <LibrarySearchBar
            value={state.search}
            onChange={state.setSearch}
            onKeyDown={state.handleSearchKeyDown}
          />

          {/* Content */}
          <div className="flex-1 overflow-auto min-h-0">
            <LibraryContent
              loading={state.loading}
              error={state.error}
              inputType={inputType}
              records={state.records}
              selectedId={state.selectedId}
              selectedRecord={state.selectedRecord}
              previewData={state.previewData}
              confirmDeleteId={state.confirmDeleteId}
              deleting={state.deleting}
              onToggleSelect={state.handleToggleSelect}
              onEdit={state.setEditRecord}
              onRequestDelete={state.setConfirmDeleteId}
              onConfirmDelete={state.handleDelete}
              onCancelDelete={() => state.setConfirmDeleteId(null)}
            />
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
              onClick={state.handleLoad}
              disabled={!state.selectedRecord}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Load Signals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog — reuses SaveToLibraryDialog in edit mode */}
      {state.editRecord && (
        <SaveToLibraryDialog
          open={!!state.editRecord}
          onOpenChange={(isOpen) => {
            if (!isOpen) state.setEditRecord(null);
          }}
          signals={state.editRecord.signals}
          inputType={state.editRecord.input_type}
          editRecord={state.editRecord}
          onSaved={state.fetchRecords}
        />
      )}
    </>
  );
}
