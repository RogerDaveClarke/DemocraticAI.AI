import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

interface SectionCardProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className, contentClassName }: PageShellProps) {
  return (
    <div className={cn('min-h-[calc(100vh-80px)] bg-[var(--dai-canvas)] px-4 py-4 lg:px-6', className)}>
      <div className={cn('mx-auto max-w-none space-y-4', contentClassName)}>{children}</div>
    </div>
  );
}

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <section className={cn('rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm', className)}>
      {children}
    </section>
  );
}
