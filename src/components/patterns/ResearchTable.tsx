import { type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy';

import { DataTable } from '@/components/ui/data-table';

interface ResearchTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
}

export function ResearchTable<TData, TValue>({
  columns,
  data,
  initialPageSize = 20,
  pageSizeOptions = [20, 40, 60],
  className,
}: ResearchTableProps<TData, TValue>) {
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
