'use client';

import { useMemo, useState } from 'react';
import type { RawWorkbook } from '@/lib/excel/raw';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [raw, setRaw] = useState<RawWorkbook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sheetNames = useMemo(
    () => (raw ? raw.sheets.map((s) => s.name) : []),
    [raw]
  );

  async function onImport() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setRaw(null);

    try {
      const formData = new FormData();
      formData.set('file', file);

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

      setRaw(data as RawWorkbook);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconegut';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function onExport() {
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

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Excel Mapping Tool (MVP)
          </h1>
          <p className="text-sm text-zinc-600">
            Importa un <span className="font-medium">.xlsx</span>, obtén RAW
            JSON (lossless per estructura tabular) i exporta un Excel nou.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Fitxer Excel (.xlsx)</span>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onImport}
                disabled={!file || busy}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Importa
              </button>
              <button
                type="button"
                onClick={onExport}
                disabled={!raw || busy}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Exporta
              </button>
            </div>
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          {raw ? (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-zinc-700">
                Sheets detectats:{' '}
                <span className="font-medium">{sheetNames.join(', ')}</span>
              </div>
              <details className="rounded-lg bg-zinc-50 p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  Veure RAW JSON
                </summary>
                <pre className="mt-3 max-h-120 overflow-auto text-xs leading-5">
                  {JSON.stringify(raw, null, 2)}
                </pre>
              </details>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
