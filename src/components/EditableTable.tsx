'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EditableRow } from '@/types/overrides';

type EditableTableProps = {
  data: EditableRow[];
  onEdit: (signalId: string, field: string, value: string | number) => void;
  onDelete: (signalId: string) => void;
};

export function EditableTable({ data, onEdit, onDelete }: EditableTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // Generate columns dynamically from data
  const columns = useMemo<ColumnDef<EditableRow>[]>(() => {
    if (data.length === 0) return [];

    const firstRow = data[0];
    const fields = Object.keys(firstRow).filter((key) => key !== 'id');

    const dataColumns: ColumnDef<EditableRow>[] = fields.map((field) => ({
      accessorKey: field,
      header: field,
      cell: ({ row, getValue }) => {
        const value = getValue() as string | number;
        
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm">{String(value ?? '')}</span>
          </div>
        );
      },
    }));

    // Add actions column
    const actionsColumn: ColumnDef<EditableRow> = {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(row.original.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    };

    return [...dataColumns, actionsColumn];
  }, [data, onDelete]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No signals generated yet. Generate signals to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-auto">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none hover:text-foreground'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' ↑',
                          desc: ' ↓',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
        {table.getRowModel().rows.length} signal(s)
      </div>
    </div>
  );
}
