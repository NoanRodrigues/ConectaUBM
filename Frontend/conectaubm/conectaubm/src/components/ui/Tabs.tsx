import { cn } from '@/utils/cn';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  items: Array<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Abas em pílula: alternância instantânea (feed, filtros de notificação, chat). */
export function PillTabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('no-scrollbar flex gap-1.5 overflow-x-auto sm:flex-wrap sm:overflow-visible', className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-150',
              active ? 'theme-dark bg-[#06204a] text-white shadow-[inset_0_-2px_0_#ffb000]' : 'bg-white/[0.05] text-fog hover:bg-white/10 hover:text-white',
            )}
          >
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span
                className={cn(
                  'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.6875rem] font-bold',
                  active ? 'bg-sun text-night' : 'bg-white/10 text-fog',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Abas sublinhadas: seções de uma mesma página (perfil). */
export function LineTabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative flex h-12 shrink-0 items-center gap-2 px-4 text-sm font-semibold transition-colors',
              active ? 'text-white' : 'text-mist hover:text-white',
            )}
          >
            {item.label}
            {item.count !== undefined && <span className={cn('text-xs', active ? 'text-brand-200' : 'text-mist')}>{item.count}</span>}
            <span
              className={cn(
                'absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-sun transition-transform duration-200',
                active ? 'scale-x-100' : 'scale-x-0',
              )}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
