import { useState, useEffect } from 'react';
import type { DeviceSignal } from '@/lib/deviceSignals';
import type {
  SignalInputType,
  SignalLibraryRecord,
} from '@/types/signal-library';

export type SaveToLibraryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signals: DeviceSignal[];
  inputType: SignalInputType;
  defaultManufacturer?: string | null;
  defaultModel?: string | null;
  parserProvider?: string;
  parserModel?: string;
  parseWarnings?: string[];
  confidenceStats?: { high: number; medium: number; low: number };
  sourceFileName?: string;
  sourceFileType?: string;
  sourceFileSize?: number;
  editRecord?: SignalLibraryRecord;
  onSaved?: () => void;
};

export function useSaveToLibrary({
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

  // Reset all form state whenever the dialog opens
  useEffect(() => {
    if (open) {
      setManufacturer(editRecord?.manufacturer ?? defaultManufacturer ?? '');
      setModel(editRecord?.model ?? defaultModel ?? '');
      setError(null);
      setSuccess(false);
      setDuplicate(false);
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
      if (isEditMode && editRecord) {
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

  return {
    isEditMode,
    manufacturer,
    setManufacturer,
    model,
    setModel,
    saving,
    error,
    success,
    duplicate,
    setDuplicate,
    handleSave,
    handleOpenChange,
  };
}
