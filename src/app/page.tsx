'use client';

import { useMemo, useState } from 'react';
import type { RawWorkbook } from '@/lib/excel/raw';

type ProtocolsMetadata = {
  internalProtocol: string | null;
  externalProtocol: string | null;
};

type ImportResponse = {
  raw: RawWorkbook;
  protocols: ProtocolsMetadata;
};

const TEMPLATES = [
  {
    id: 'bacnet-server__modbus-master',
    label: 'BACnet Server → Modbus Master',
    href: '/templates/bacnet-server-to-modbus-master.xlsx',
    expectedSheets: ['Signals', 'BACnet Server', 'Conversions'],
  },
  {
    id: 'modbus-slave__bacnet-client',
    label: 'Modbus Slave → BACnet Client',
    href: '/templates/modbus-slave-to-bacnet-client.xlsx',
    expectedSheets: ['Signals', 'Conversions'],
  },
] as const;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [raw, setRaw] = useState<RawWorkbook | null>(null);
  const [protocols, setProtocols] = useState<ProtocolsMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState<
    (typeof TEMPLATES)[number]['id']
  >(TEMPLATES[0].id);

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplateId)!,
    [selectedTemplateId]
  );

  const sheetNames = useMemo(
    () => (raw ? raw.sheets.map((s) => s.name) : []),
    [raw]
  );

  async function importArrayBufferAsFile(
    arrayBuffer: ArrayBuffer,
    filename: string,
    expectedSheets?: string[]
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

  async function onLoadTemplate() {
    setError(null);
    setBusy(true);

    try {
      const res = await fetch(selectedTemplate.href);
      if (!res.ok) throw new Error("No s'ha pogut carregar la plantilla.");

      const arrayBuffer = await res.arrayBuffer();
      await importArrayBufferAsFile(
        arrayBuffer,
        selectedTemplate.href.split('/').pop()!,
        selectedTemplate.expectedSheets as unknown as string[]
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconegut';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function onImport() {
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    await importArrayBufferAsFile(arrayBuffer, file.name);
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

        {/* Plantilles de repositori */}
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-base font-semibold">Plantilles (repositori)</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Selecciona un gateway type i carrega la plantilla.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Gateway type</span>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedTemplateId === template.id
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onLoadTemplate}
              disabled={busy}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Carrega plantilla
            </button>
          </div>

          {protocols ? (
            <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm">
              <div className="font-medium">Protocols detectats:</div>
              <div className="mt-2 space-y-1 text-zinc-700">
                <div>
                  <span className="font-medium">Signals!B4 (Internal):</span>{' '}
                  {protocols.internalProtocol ?? '—'}
                </div>
                <div>
                  <span className="font-medium">Signals!B5 (External):</span>{' '}
                  {protocols.externalProtocol ?? '—'}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* Import manual */}
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-base font-semibold">Import manual (upload)</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Puja un fitxer Excel per importar-lo.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Fitxer Excel (.xlsx)</span>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
              />
            </label>

            <button
              type="button"
              onClick={onImport}
              disabled={!file || busy}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Importa
            </button>
          </div>
        </section>

        {/* Errors */}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Resultats (RAW + Export) */}
        {raw ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-700">
                Sheets detectats:{' '}
                <span className="font-medium">{sheetNames.join(', ')}</span>
              </div>

              <button
                type="button"
                onClick={onExport}
                disabled={busy}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Exporta
              </button>
            </div>

            <details className="mt-4 rounded-lg bg-zinc-50 p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Veure RAW JSON
              </summary>
              <pre className="mt-3 max-h-120 overflow-auto text-xs leading-5">
                {JSON.stringify(raw, null, 2)}
              </pre>
            </details>
          </section>
        ) : null}
      </main>
    </div>
  );
}
