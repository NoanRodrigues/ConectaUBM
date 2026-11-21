import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRail } from '@/hooks/useRail';
import { cn } from '@/utils/cn';

/**
 * Quantos cartões cabem por linha. A fração garante o último cartão cortado à direita.
 * feed: carrossel do Início. compact: destaques no perfil.
 * No feed, celulares e tablets (`touch:`) mostram mais cartões, menores; o desktop mantém os valores originais.
 */
const SIZES = {
  feed: '[--rail-per:2.7] [--rail-gaps:1.5rem] sm:[--rail-per:4.4] sm:[--rail-gaps:3rem] touch:[--rail-per:3.6] touch:[--rail-gaps:2.25rem] touch:sm:[--rail-per:5.6] touch:sm:[--rail-gaps:3.75rem]',
  compact: '[--rail-per:2.85] [--rail-gaps:1.5rem] sm:[--rail-per:5.4] sm:[--rail-gaps:3.75rem]',
} as const;

/** Setas só aparecem com mouse ou trackpad; no toque, o arraste com o dedo é livre. */
const ARROW =
  'absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-ink-800 text-white shadow-float transition-colors hover:bg-ink-700 [@media(hover:hover)_and_(pointer:fine)]:grid';

interface RailProps {
  label: string;
  children: ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Faixa horizontal de cartões quadrados (Connecs no feed e destaques no perfil). */
export function Rail({ label, children, size = 'feed', className }: RailProps) {
  const { ref, edges, next, prev } = useRail<HTMLUListElement>();

  return (
    <div className="relative">
      <ul
        ref={ref}
        aria-label={label}
        className={cn('no-scrollbar relative flex gap-3 overflow-x-auto overscroll-x-contain', SIZES[size], className)}
      >
        {children}
      </ul>
      {!edges.atStart && (
        <button type="button" aria-label="Ver anteriores" className={cn(ARROW, '-left-2')} onClick={prev}>
          <ChevronLeft className="size-5" aria-hidden />
        </button>
      )}
      {!edges.atEnd && (
        <button type="button" aria-label="Ver mais" className={cn(ARROW, '-right-2')} onClick={next}>
          <ChevronRight className="size-5" aria-hidden />
        </button>
      )}
    </div>
  );
}
