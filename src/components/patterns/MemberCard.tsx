import { Bookmark, User } from 'lucide-react';

import { cn } from '@/lib/utils';

interface MemberCardProps {
  id: string;
  name: string;
  party: string;
  chamber: string;
  constituency?: string;
  photoUrl?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function MemberCard({
  id,
  name,
  party,
  chamber,
  constituency,
  photoUrl,
  selected = false,
  onSelect,
}: MemberCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)] transition-all',
        selected ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      )}
      onClick={() => onSelect?.(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onSelect?.(id);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="h-14 w-14 rounded-full object-cover ring-1 ring-slate-200"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
              <User className="h-6 w-6 text-slate-400" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
            <Bookmark className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-300" />
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{party}</p>
          <p className="truncate text-xs text-slate-500">{chamber}</p>
          {constituency ? <p className="truncate text-xs text-slate-500">{constituency}</p> : null}
        </div>
      </div>
    </div>
  );
}
