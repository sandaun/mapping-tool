import { useRef } from 'react';
import { flexRender, type Table, type Row } from '@tanstack/react-table';
import type { EditableRow } from '@/types/overrides';

interface TableBodyProps {
  table: Table<EditableRow>;
  enableSelection: boolean;
  selectedRowIds?: string[];
  onSelectedRowIdsChange?: (signalIds: string[]) => void;
}

export function TableBody({
  table,
  enableSelection,
  selectedRowIds,
  onSelectedRowIdsChange,
}: TableBodyProps) {
  const lastClickedRowIdRef = useRef<string | null>(null);

  const handleRowClick = (e: React.MouseEvent, row: Row<EditableRow>) => {
    if (!enableSelection || !onSelectedRowIdsChange) return;

    // Shift+Click: range selection
    if (e.shiftKey && lastClickedRowIdRef.current) {
      const visibleRows = table.getRowModel().rows;
      const lastIdx = visibleRows.findIndex(
        (r) => r.id === lastClickedRowIdRef.current,
      );
      const currentIdx = visibleRows.findIndex((r) => r.id === row.id);

      if (lastIdx !== -1 && currentIdx !== -1) {
        const start = Math.min(lastIdx, currentIdx);
        const end = Math.max(lastIdx, currentIdx);
        const currentIds = new Set(selectedRowIds ?? []);
        const isDeselecting = currentIds.has(row.id);

        for (let i = start; i <= end; i++) {
          if (isDeselecting) {
            currentIds.delete(visibleRows[i].id);
          } else {
            currentIds.add(visibleRows[i].id);
          }
        }

        onSelectedRowIdsChange([...currentIds]);
        return;
      }
    }

    // Single click: toggle
    row.toggleSelected();
    lastClickedRowIdRef.current = row.id;
  };

  return (
    <tbody>
      {table.getRowModel().rows.map((row) => (
        <tr
          key={row.id}
          className={`border-b border-border last:border-0 ${
            enableSelection ? 'cursor-pointer select-none' : ''
          } ${
            row.getIsSelected()
              ? 'bg-primary/10 hover:bg-primary/15'
              : 'hover:bg-muted/30'
          }`}
          onClick={(e) => handleRowClick(e, row)}
        >
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id} className="px-4 py-2">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
