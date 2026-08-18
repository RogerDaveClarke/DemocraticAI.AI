import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EvidencePanelProps {
  title?: string;
  points: string[];
  limitation?: string;
  footer?: ReactNode;
  className?: string;
}

export function EvidencePanel({ title = 'Evidence and provenance', points, limitation, footer, className }: EvidencePanelProps) {
  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm', className)}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-2 space-y-1">
        {points.map((point) => (
          <li key={point} className="list-inside list-disc">{point}</li>
        ))}
      </ul>
      {limitation ? <p className="mt-3 text-xs text-slate-500">Limitation: {limitation}</p> : null}
      {footer ? <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">{footer}</div> : null}
    </section>
  );
}
