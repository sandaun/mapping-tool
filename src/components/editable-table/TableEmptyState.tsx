export function TableEmptyState() {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
      <p className="text-sm text-muted-foreground">
        No signals generated yet. Generate signals to see them here.
      </p>
    </div>
  );
}
