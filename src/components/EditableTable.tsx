'use client';

import {
  useEditableTable,
  type EditableTableOptions,
} from '@/hooks/useEditableTable';
import { TableHeader } from '@/components/editable-table/TableHeader';
import { TableBody } from '@/components/editable-table/TableBody';
import { TableFooter } from '@/components/editable-table/TableFooter';
import { TableEmptyState } from '@/components/editable-table/TableEmptyState';

// Re-export the options type as the component's props for consumers
export type EditableTableProps = EditableTableOptions;

export function EditableTable(props: EditableTableProps) {
  const { table, enableSelection, selectedRowIds, onSelectedRowIdsChange } =
    useEditableTable(props);

  if (props.data.length === 0) {
    return <TableEmptyState />;
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-auto">
        <table className="w-full">
          <TableHeader table={table} />
          <TableBody
            table={table}
            enableSelection={enableSelection}
            selectedRowIds={selectedRowIds}
            onSelectedRowIdsChange={onSelectedRowIdsChange}
          />
        </table>
      </div>
      <TableFooter rowCount={table.getRowModel().rows.length} />
    </div>
  );
}
