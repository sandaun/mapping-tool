import { Badge } from '@/components/ui/badge';

interface InputWarningsProps {
  warnings: string[];
}

export function InputWarnings({ warnings }: InputWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-4">
      <div className="flex items-center gap-2">
        <Badge variant="destructive" className="bg-amber-600">
          {warnings.length}
        </Badge>
        <span className="text-sm font-semibold text-amber-900 dark:text-amber-300">
          Warnings
        </span>
      </div>
      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-amber-800 dark:text-amber-300/80">
        {warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </div>
  );
}
