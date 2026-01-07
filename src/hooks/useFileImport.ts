import { useState } from 'react';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { ImportResponse, ProtocolsMetadata } from '@/types/page.types';

export function useFileImport() {
  const [raw, setRaw] = useState<RawWorkbook | null>(null);
  const [protocols, setProtocols] = useState<ProtocolsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function importArrayBufferAsFile(
    arrayBuffer: ArrayBuffer,
    filename: string,
    expectedSheets?: readonly string[]
  ) {
    setError(null);
    setBusy(true);

    try {
      const file = new File([arrayBuffer], filename, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const formData = new FormData();
      formData.set('file', file);

      if (expectedSheets) {
        formData.set('expectedSheets', JSON.stringify(expectedSheets));
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as unknown;
      if (!res.ok) {
        const message =
          typeof data === 'object' && data && 'error' in data
            ? String((data as { error: unknown }).error)
            : 'Error important.';
        throw new Error(message);
      }

      const importData = data as ImportResponse;
      setRaw(importData.raw);
      setProtocols(importData.protocols);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconegut';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function exportWorkbook() {
    if (!raw) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(raw),
      });

      if (!res.ok) {
        const data = (await res.json()) as unknown;
        const message =
          typeof data === 'object' && data && 'error' in data
            ? String((data as { error: unknown }).error)
            : 'Error exportant.';
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconegut';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return {
    raw,
    protocols,
    error,
    busy,
    importArrayBufferAsFile,
    exportWorkbook,
  };
}
