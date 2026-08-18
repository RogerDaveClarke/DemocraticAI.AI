import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface PageHeroProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  question?: string;
  rightMeta?: string;
  className?: string;
}

export function PageHero({ title, subtitle, icon: Icon, question, rightMeta, className }: PageHeroProps) {
  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)]', className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[clamp(1.8rem,2.5vw,2.4rem)] font-semibold tracking-[-0.03em] text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500 sm:text-base">{subtitle}</p>
            {question ? <p className="mt-2 text-sm text-slate-600">Primary question: {question}</p> : null}
          </div>
        </div>
        {rightMeta ? <p className="text-sm text-slate-500">{rightMeta}</p> : null}
      </div>
    </section>
  );
}
