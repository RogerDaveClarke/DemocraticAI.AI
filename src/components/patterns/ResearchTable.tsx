import { type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy';

import { DataTable } from '@/components/ui/data-table';

interface ResearchTableProps<TData extends Record<string, any>> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
}

export function ResearchTable<TData extends Record<string, any>>({
  columns,
  data,
  initialPageSize = 20,
  pageSizeOptions = [20, 40, 60],
  className,
}: ResearchTableProps<TData>) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <DataTable
        columns={columns}
        data={data}
        className={className}
        initialPageSize={initialPageSize}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}
