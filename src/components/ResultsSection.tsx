import type { RawWorkbook } from '@/lib/excel/raw';

type ResultsSectionProps = {
  raw: RawWorkbook;
  sheetNames: string[];
  onExport: () => void;
  busy: boolean;
};

export function ResultsSection({
  raw,
  sheetNames,
  onExport,
  busy,
}: ResultsSectionProps) {
  return (
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
  );
}
