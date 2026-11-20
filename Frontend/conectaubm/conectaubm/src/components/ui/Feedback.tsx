import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

/** Estado vazio: explica o que falta e convida para a próxima ação. */
export function EmptyState({ icon: Icon, title, description, action, className, compact = false }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 text-center', compact ? 'py-8' : 'py-14', className)}>
      <span className="relative mb-4 grid size-16 place-items-center rounded-squircle border border-brand-400/30 bg-brand/20 text-brand-200">
        <Icon className="size-7" strokeWidth={1.75} aria-hidden />
        <span className="absolute -right-1 -top-1 size-3 rounded-full bg-brand-300 ring-4 ring-ink-800" aria-hidden />
      </span>
      <h3 className="text-base font-bold text-white">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-fog">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function PostSkeleton() {
  return (
    <div className="card p-4 sm:p-5" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-squircle" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <Skeleton className="mt-4 h-56 w-full rounded-2xl" />
      <div className="mt-4 flex gap-3">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

export function StudentSkeleton() {
  return (
    <div className="card p-4" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 rounded-squircle" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-3/4" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="size-10 rounded-squircle" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
