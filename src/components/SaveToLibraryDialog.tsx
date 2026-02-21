'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Save, SkipForward, Pencil } from 'lucide-react';
import type { DeviceSignal } from '@/lib/deviceSignals';
import type {
  SignalInputType,
  SignalLibraryRecord,
} from '@/types/signal-library';

type SaveToLibraryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signals: DeviceSignal[];
  inputType: SignalInputType;
  /** Pre-filled if AI detected manufacturer */
  defaultManufacturer?: string | null;
  /** Pre-filled if AI detected model */
  defaultModel?: string | null;
  /** AI metadata for saving */
  parserProvider?: string;
  parserModel?: string;
  parseWarnings?: string[];
  confidenceStats?: { high: number; medium: number; low: number };
  sourceFileName?: string;
  sourceFileType?: string;
  sourceFileSize?: number;
  /** If set, dialog enters "edit" mode — only manufacturer/model can be changed */
  editRecord?: SignalLibraryRecord;
  /** Called after a successful save/edit so the parent can refresh */
  onSaved?: () => void;
};

export function SaveToLibraryDialog({
  open,
  onOpenChange,
  signals,
  inputType,
  defaultManufacturer,
  defaultModel,
  parserProvider,
  parserModel,
  parseWarnings = [],
  confidenceStats,
  sourceFileName,
  sourceFileType,
  sourceFileSize,
  editRecord,
  onSaved,
}: SaveToLibraryDialogProps) {
  const isEditMode = !!editRecord;
  const [manufacturer, setManufacturer] = useState(
    editRecord?.manufacturer ?? defaultManufacturer ?? '',
  );
  const [model, setModel] = useState(editRecord?.model ?? defaultModel ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  // Reset all form state whenever the dialog opens — covers both user-initiated
  // and programmatic opens (where Radix onOpenChange is NOT called).
  useEffect(() => {
    if (open) {
      setManufacturer(editRecord?.manufacturer ?? defaultManufacturer ?? '');
      setModel(editRecord?.model ?? defaultModel ?? '');
      setError(null);
      setSuccess(false);
      setDuplicate(false);
      setSaving(false);
    }
    // We intentionally react only to `open` — the other deps are read at
    // the moment the effect fires but should not trigger it independently.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Forward open/close to parent; state reset is handled by the useEffect above.
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const handleSave = async (overwrite = false) => {
    if (!manufacturer.trim() || !model.trim()) {
      setError('Manufacturer and model are required.');
      return;
    }

    setSaving(true);
    setError(null);
    setDuplicate(false);

    try {
      if (isEditMode) {
        // PATCH mode — update manufacturer/model only
        const res = await fetch('/api/signal-library', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editRecord.id,
            manufacturer: manufacturer.trim(),
            model: model.trim(),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update');
        }

        setSuccess(true);
        onSaved?.();
        setTimeout(() => handleOpenChange(false), 1200);
        return;
      }

      // POST mode — create new record
      const res = await fetch('/api/signal-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          inputType,
          signals,
          parserVersion: '1.0',
          parserProvider,
          parserModel,
          parseWarnings,
          confidenceStats,
          sourceFileName,
          sourceFileType,
          sourceFileSize,
          overwrite,
        }),
      });

      if (res.status === 409) {
        setDuplicate(true);
        setSaving(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess(true);
      onSaved?.();
      setTimeout(() => handleOpenChange(false), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md border-slate-400 dark:border-slate-600">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <Pencil className="w-5 h-5 text-primary" />
            ) : (
              <Save className="w-5 h-5 text-primary" />
            )}
            {isEditMode ? 'Edit Record' : 'Save to Library'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Update manufacturer/model for this ${inputType} record.`
              : `Save these ${signals.length} ${inputType} signals so you can reuse them later without re-parsing.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground mb-1 block">
              Manufacturer / Brand
            </label>
            <input
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g. Schneider Electric, Siemens..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={saving || success}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground mb-1 block">
              Model / Reference
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. PM5110, iEM3155..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={saving || success}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {duplicate && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                A record already exists for <strong>{manufacturer}</strong> /{' '}
                <strong>{model}</strong> ({inputType}).
              </p>
              <div className="flex gap-2">
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => setDuplicate(false)}
                  className="text-xs"
                >
                  Change name
                </Button>
                <Button
                  variant="primary-action"
                  size="sm"
                  onClick={() => handleSave(true)}
                  className="text-xs"
                >
                  Overwrite
                </Button>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-950/20 p-3">
              <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                ✓ Saved to library successfully!
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-200 dark:border-slate-700">
          {!isEditMode && (
            <Button
              variant="neutral"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              <SkipForward className="w-3.5 h-3.5 mr-1" />
              Skip
            </Button>
          )}
          {isEditMode && (
            <Button
              variant="neutral"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="primary-action"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={
              saving || success || !manufacturer.trim() || !model.trim()
            }
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : isEditMode ? (
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {saving ? 'Saving...' : isEditMode ? 'Update' : 'Save to Library'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
