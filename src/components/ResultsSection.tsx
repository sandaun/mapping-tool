import type { RawWorkbook } from '@/lib/excel/raw';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sheets detected:</span>
          {sheetNames.map((name) => (
            <Badge key={name} variant="outline">
              {name}
            </Badge>
          ))}
        </div>

        <Button
          type="button"
          onClick={onExport}
          disabled={busy}
          variant="outline"
          size="lg"
          className="border-primary bg-primary/5 text-primary hover:border-primary/60 hover:bg-primary/10 hover:text-primary dark:bg-primary/10 dark:hover:bg-primary/15"
        >
          ⬇ Download Excel
        </Button>
      </div>

      <details className="mt-4 rounded-lg border border-border bg-muted/50 p-3">
        <summary className="cursor-pointer text-sm font-medium text-foreground">
          View RAW JSON
        </summary>
        <pre className="mt-3 max-h-120 overflow-auto text-xs leading-5 text-muted-foreground">
          {JSON.stringify(raw, null, 2)}
        </pre>
      </details>
    </section>
  );
}
