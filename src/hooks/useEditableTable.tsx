import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EditableRow } from '@/types/overrides';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type EditableTableOptions = {
  data: EditableRow[];
  onDelete?: (signalId: string) => void;
  enableSelection?: boolean;
  selectedRowIds?: string[];
  onSelectedRowIdsChange?: (signalIds: string[]) => void;
  /** Optional custom cell renderer. Return undefined to use default rendering. */
  renderCell?: (
    columnKey: string,
    value: unknown,
    row: EditableRow,
  ) => ReactNode | undefined;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEditableTable({
  data,
  onDelete,
  enableSelection = false,
  selectedRowIds,
  onSelectedRowIdsChange,
  renderCell,
}: EditableTableOptions) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Adapt selectedRowIds (string[]) → RowSelectionState (Record<string, boolean>)
  const rowSelection = useMemo<RowSelectionState>(() => {
    if (!enableSelection || !selectedRowIds) return {};

    return selectedRowIds.reduce<RowSelectionState>((acc, signalId) => {
      acc[signalId] = true;
      return acc;
    }, {});
  }, [enableSelection, selectedRowIds]);

  // Generate columns dynamically from data keys
  const columns = useMemo<ColumnDef<EditableRow>[]>(() => {
    if (data.length === 0) return [];

    const firstRow = data[0];
    const fields = Object.keys(firstRow).filter(
      (key) => key !== 'id' && !key.startsWith('_'),
    );

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

    // Append delete actions column when onDelete is provided
    if (onDelete) {
      const actionsColumn: ColumnDef<EditableRow> = {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(row.original.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      };
      return [...dataColumns, actionsColumn];
    }

    return dataColumns;
  }, [data, onDelete, renderCell]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: enableSelection,
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      if (!enableSelection || !onSelectedRowIdsChange) return;

      const nextSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;

      const nextSelectedSignalIds = Object.keys(nextSelection).filter(
        (key) => nextSelection[key],
      );

      onSelectedRowIdsChange(nextSelectedSignalIds);
    },
    state: {
      sorting,
      rowSelection,
    },
  });

  return {
    table,
    enableSelection,
    selectedRowIds,
    onSelectedRowIdsChange,
  };
}
