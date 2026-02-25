interface TableFooterProps {
  rowCount: number;
}

export function TableFooter({ rowCount }: TableFooterProps) {
  return (
    <div className="border-t border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
      {rowCount} signal(s)
    </div>
  );
}
