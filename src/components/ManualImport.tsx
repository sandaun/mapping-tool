import { Button } from '@/components/ui/button';

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
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Custom Import</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload a custom Excel file.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Excel File (.xlsx)</span>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground file:shadow-sm hover:file:bg-primary/90"
          />
        </label>

        <Button
          type="button"
          onClick={onImport}
          disabled={!file || busy}
          variant="default"
          size="lg"
        >
          📁 Import File
        </Button>
      </div>
    </section>
  );
}
