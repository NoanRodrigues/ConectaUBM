import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { lockScroll } from '@/utils/scrollLock';

const WIDTHS = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' } as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof WIDTHS;
  children: ReactNode;
  footer?: ReactNode;
  /** Quando false, clicar fora e Esc não fecham (ex.: publicação em andamento). */
  dismissible?: boolean;
  /** Esconde o cabeçalho visual mantendo o título para leitores de tela. */
  hideHeader?: boolean;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Modal responsivo: folha que sobe do rodapé no celular, janela centralizada em telas maiores. */
export function Modal({ open, onClose, title, description, size = 'md', children, footer, dismissible = true, hideHeader = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const unlockScroll = lockScroll();
    const panel = panelRef.current;
    const autofocus = panel?.querySelector<HTMLElement>('[data-autofocus]');
    (autofocus ?? panel)?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockScroll();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, dismissible]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-night/60 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-sheet-in flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-ink-800 shadow-float outline-none sm:animate-pop-in sm:rounded-[1.5rem]',
          WIDTHS[size],
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" aria-hidden />
        {hideHeader ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : (
          <header className="flex shrink-0 items-start gap-4 px-5 pb-3 pt-4 sm:px-6 sm:pt-5">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-bold leading-tight text-white">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-fog">{description}</p>}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="-mr-1.5 grid size-9 shrink-0 place-items-center rounded-xl text-fog transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" aria-hidden />
              </button>
            )}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-line bg-ink-850 px-5 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
