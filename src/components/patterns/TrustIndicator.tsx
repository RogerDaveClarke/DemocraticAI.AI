import { CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface TrustIndicatorProps {
  label: string;
  detail: string;
  className?: string;
}

export function TrustIndicator({ label, detail, className }: TrustIndicatorProps) {
  return (
    <article className={cn('rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm', className)}>
      <p className="inline-flex items-center gap-2 font-medium text-slate-800">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        {label}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
