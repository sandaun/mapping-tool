import { Badge } from '@/components/ui/badge';

type ErrorDisplayProps = {
  error: string | null;
};

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4">
      <div className="flex items-center gap-2">
        <Badge variant="destructive">⚠ ERROR</Badge>
        <span className="text-sm text-destructive">{error}</span>
      </div>
    </div>
  );
}
