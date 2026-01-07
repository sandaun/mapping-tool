type ManualImportProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onImport: () => void;
  busy: boolean;
};

export function ManualImport({
  file,
  onFileChange,
  onImport,
  busy,
}: ManualImportProps) {
  return (
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
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
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
  );
}
