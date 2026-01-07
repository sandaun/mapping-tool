import { useState } from 'react';
import type { RawWorkbook } from '@/lib/excel/raw';
import type { ImportResponse, ProtocolsMetadata } from '@/types/page.types';

// Type guards
function isErrorResponse(data: unknown): data is { error: unknown } {
  return typeof data === 'object' && data !== null && 'error' in data;
}

function isImportResponse(data: unknown): data is ImportResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'raw' in data &&
    'protocols' in data
  );
}

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

      const data: unknown = await res.json();
      if (!res.ok) {
        const message = isErrorResponse(data)
          ? String(data.error)
          : 'Error important.';
        throw new Error(message);
      }

      if (!isImportResponse(data)) {
        throw new Error('Resposta invàlida del servidor.');
      }

      setRaw(data.raw);
      setProtocols(data.protocols);
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
        const data: unknown = await res.json();
        const message = isErrorResponse(data)
          ? String(data.error)
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
    setRaw,
    protocols,
    error,
    busy,
    importArrayBufferAsFile,
    exportWorkbook,
  };
}
