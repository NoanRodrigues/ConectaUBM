import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  /** Linha separadora antes do item. */
  separated?: boolean;
}

interface MenuProps {
  /** Nome acessível do botão que abre o menu. */
  label: string;
  items: Array<MenuItem | false | null | undefined>;
  children: ReactNode;
  align?: 'left' | 'right';
  side?: 'bottom' | 'top';
  buttonClassName?: string;
  className?: string;
  header?: ReactNode;
}

/** Menu suspenso acessível: abre no clique, fecha com Esc ou clique fora, setas navegam. */
export function Menu({ label, items, children, align = 'right', side = 'bottom', buttonClassName, className, header }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const visible = items.filter(Boolean) as MenuItem[];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    listRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const options = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const index = options.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'ArrowDown' ? (index + 1) % options.length : (index - 1 + options.length) % options.length;
    options[next]?.focus();
  };

  return (
    <div ref={rootRef} className={cn('relative', className)} onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={buttonClassName}
        onClick={() => setOpen((value) => !value)}
      >
        {children}
      </button>
      {open && (
        <div
          ref={listRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className={cn(
            'absolute z-50 min-w-[13.5rem] animate-menu-in rounded-2xl border border-white/10 bg-ink-600 p-1.5 shadow-float',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
          )}
        >
          {header}
          {visible.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                {item.separated && <div className="mx-2 my-1.5 h-px bg-white/10" role="separator" />}
                <button
                  type="button"
                  role="menuitem"
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium outline-none transition-colors focus-visible:bg-white/10',
                    item.danger ? 'text-danger hover:bg-danger/10' : 'text-white hover:bg-white/10',
                  )}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  {Icon && <Icon className={cn('size-[1.125rem] shrink-0', item.danger ? 'text-danger' : 'text-fog')} aria-hidden />}
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
