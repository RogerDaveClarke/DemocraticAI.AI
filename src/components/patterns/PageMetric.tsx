import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageMetricProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
}

export function PageMetric({ label, value, icon, className }: PageMetricProps) {
  return (
    <article className={cn('rounded-lg bg-slate-50 p-2 text-center', className)}>
      {icon ? <div className="mb-1 inline-flex text-slate-500">{icon}</div> : null}
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </article>
  );
}
