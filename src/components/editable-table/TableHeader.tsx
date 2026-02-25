import { flexRender, type Table } from '@tanstack/react-table';
import type { EditableRow } from '@/types/overrides';

interface TableHeaderProps {
  table: Table<EditableRow>;
}

export function TableHeader({ table }: TableHeaderProps) {
  return (
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
  );
}
