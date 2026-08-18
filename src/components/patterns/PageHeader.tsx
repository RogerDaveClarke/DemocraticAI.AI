import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, rightSlot, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between', className)}>
      <div>
        <h2 className="text-[clamp(1.55rem,2.1vw,2.25rem)] font-semibold tracking-[-0.03em] text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {rightSlot ? <div className="self-start text-sm text-slate-500">{rightSlot}</div> : null}
    </header>
  );
}
