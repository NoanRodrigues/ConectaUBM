import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

const SIDES = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
} as const;

interface TooltipProps {
  label: string;
  side?: keyof typeof SIDES;
  children: ReactNode;
  className?: string;
}

/** Dica exibida ao passar o mouse ou focar pelo teclado (não aparece em telas de toque). */
export function Tooltip({ label, side = 'bottom', children, className }: TooltipProps) {
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-[70] hidden whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-ink shadow-float',
          'opacity-0 transition-opacity delay-200 duration-150 group-focus-within/tip:opacity-100 [@media(hover:hover)]:block [@media(hover:hover)]:group-hover/tip:opacity-100',
          SIDES[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}
