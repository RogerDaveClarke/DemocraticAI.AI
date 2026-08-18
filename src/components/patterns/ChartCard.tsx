import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="mb-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
