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
import type { ReactNode } from 'react';

type EditableTableProps = {
  data: EditableRow[];
  onDelete?: (signalId: string) => void;
  /** Optional custom cell renderer. Return undefined to use default rendering. */
  renderCell?: (columnKey: string, value: unknown, row: EditableRow) => ReactNode | undefined;
};

export function EditableTable({ data, onDelete, renderCell }: EditableTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Generate columns dynamically from data
  const columns = useMemo<ColumnDef<EditableRow>[]>(() => {
    if (data.length === 0) return [];

    const firstRow = data[0];
    const fields = Object.keys(firstRow).filter((key) => key !== 'id' && !key.startsWith('_'));

    const dataColumns: ColumnDef<EditableRow>[] = fields.map((field) => ({
      accessorKey: field,
      header: field,
      cell: ({ getValue, row: tableRow }) => {
        const value = getValue() as string | number;
        const custom = renderCell?.(field, value, tableRow.original);
        if (custom !== undefined) return custom;

        return (
          <div className="flex items-center justify-between">
            <span className="text-sm">{String(value ?? '')}</span>
          </div>
        );
      },
    }));

    // Only add actions column if onDelete is provided
    if (onDelete) {
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
    }

    return dataColumns;
  }, [data, onDelete]);

  // eslint-disable-next-line react-hooks/incompatible-library
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
                          header.getContext(),
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
