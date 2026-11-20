import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PopoverProps {
  /** Conteúdo do botão que abre o painel. */
  button: ReactNode;
  buttonClassName?: string;
  buttonLabel?: string;
  align?: 'left' | 'right';
  side?: 'bottom' | 'top';
  panelClassName?: string;
  children: ReactNode | ((close: () => void) => ReactNode);
}

/** Painel flutuante genérico (filtros, seletor de emoji). Fecha com Esc ou clique fora. */
export function Popover({ button, buttonClassName, buttonLabel, align = 'left', side = 'bottom', panelClassName, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-expanded={open} aria-haspopup="dialog" aria-label={buttonLabel} className={buttonClassName} onClick={() => setOpen((value) => !value)}>
        {button}
      </button>
      {open && (
        <div
          role="dialog"
          className={cn(
            'absolute z-50 animate-menu-in rounded-2xl border border-white/10 bg-ink-600 p-3 shadow-float',
            side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}
