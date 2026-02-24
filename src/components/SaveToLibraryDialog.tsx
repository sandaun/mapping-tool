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
import {
  Loader2,
  Save,
  SkipForward,
  Pencil,
  X,
  SaveAll,
  PenLine,
} from 'lucide-react';
import {
  useSaveToLibrary,
  type SaveToLibraryDialogProps,
} from '@/hooks/useSaveToLibrary';

export function SaveToLibraryDialog(props: SaveToLibraryDialogProps) {
  const state = useSaveToLibrary(props);

  return (
    <Dialog open={props.open} onOpenChange={state.handleOpenChange}>
      <DialogContent className="sm:max-w-md border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {state.isEditMode ? (
              <Pencil className="w-5 h-5 text-primary" />
            ) : (
              <Save className="w-5 h-5 text-primary" />
            )}
            {state.isEditMode ? 'Edit Record' : 'Save to Library'}
          </DialogTitle>
          <DialogDescription>
            {state.isEditMode
              ? `Update manufacturer/model for this ${props.inputType} record.`
              : `Save these ${props.signals.length} ${props.inputType} signals so you can reuse them later without re-parsing.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground mb-1 block">
              Manufacturer / Brand
            </label>
            <input
              type="text"
              value={state.manufacturer}
              onChange={(e) => state.setManufacturer(e.target.value)}
              placeholder="e.g. Schneider Electric, Siemens..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={state.saving || state.success}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground mb-1 block">
              Model / Reference
            </label>
            <input
              type="text"
              value={state.model}
              onChange={(e) => state.setModel(e.target.value)}
              placeholder="e.g. PM5110, iEM3155..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={state.saving || state.success}
            />
          </div>

          {state.error && <p className="text-sm text-red-500">{state.error}</p>}

          {state.duplicate && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                A record already exists for{' '}
                <strong>{state.manufacturer}</strong> /{' '}
                <strong>{state.model}</strong> ({props.inputType}).
              </p>
              <div className="flex gap-2">
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => state.setDuplicate(false)}
                  className="text-xs"
                >
                  <PenLine className="w-3.5 h-3.5 mr-1.5" />
                  Change name
                </Button>
                <Button
                  variant="primary-action"
                  size="sm"
                  onClick={() => state.handleSave(true)}
                  className="text-xs"
                >
                  <SaveAll className="w-3.5 h-3.5 mr-1.5" />
                  Overwrite
                </Button>
              </div>
            </div>
          )}

          {state.success && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-950/20 p-3">
              <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                ✓ Saved to library successfully!
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border">
          {!state.isEditMode && (
            <Button
              variant="neutral"
              size="sm"
              onClick={() => state.handleOpenChange(false)}
              disabled={state.saving}
            >
              <SkipForward className="w-3.5 h-3.5 mr-1" />
              Skip
            </Button>
          )}
          {state.isEditMode && (
            <Button
              variant="neutral"
              size="sm"
              onClick={() => state.handleOpenChange(false)}
              disabled={state.saving}
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Cancel
            </Button>
          )}
          <Button
            variant="primary-action"
            size="sm"
            onClick={() => state.handleSave(false)}
            disabled={
              state.saving ||
              state.success ||
              !state.manufacturer.trim() ||
              !state.model.trim()
            }
          >
            {state.saving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : state.isEditMode ? (
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {state.saving
              ? 'Saving...'
              : state.isEditMode
                ? 'Update'
                : 'Save to Library'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
