import { cn } from '@/lib/utils';

interface TimelineItem {
  id: string;
  dateLabel: string;
  title: string;
  detail?: string;
}

interface TimelineProps {
  title?: string;
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ title = 'Timeline', items, className }: TimelineProps) {
  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <ol className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="relative pl-5">
            <span className="absolute left-0 top-1 h-2.5 w-2.5 rounded-full bg-cyan-600" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.dateLabel}</p>
            <p className="text-sm font-medium text-slate-800">{item.title}</p>
            {item.detail ? <p className="text-sm text-slate-600">{item.detail}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
