import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface InsightCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  className?: string;
}

export function InsightCard({ title, subtitle, icon: Icon, className }: InsightCardProps) {
  return (
    <article className={cn('rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50', className)}>
      <div className="mb-2 inline-flex rounded-lg bg-cyan-50 p-2 text-cyan-700">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold text-slate-800">{title}</p>
      <p className="text-[11px] text-slate-500">{subtitle}</p>
    </article>
  );
}
