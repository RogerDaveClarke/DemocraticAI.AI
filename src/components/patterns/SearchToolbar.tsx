import { type ReactNode } from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SearchToolbarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rightSlot?: ReactNode;
  className?: string;
}

export function SearchToolbar({ value, onChange, placeholder, rightSlot, className, onBlur }: SearchToolbarProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-center', className)}>
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => onBlur?.(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none ring-cyan-200 transition focus:ring"
        />
      </label>
      {rightSlot ? <div>{rightSlot}</div> : null}
    </div>
  );
}
