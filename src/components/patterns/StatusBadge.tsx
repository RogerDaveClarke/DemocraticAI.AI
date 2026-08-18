import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'warning' | 'error' | 'info';
  label?: string;
  className?: string;
}

const statusTone: Record<StatusBadgeProps['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-500',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-cyan-100 text-cyan-700',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={cn('rounded-full px-2 py-1 text-xs font-medium', statusTone[status], className)}>
      {label ?? status}
    </span>
  );
}
