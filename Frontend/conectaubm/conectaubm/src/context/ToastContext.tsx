import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { uid } from '@/utils/format';

type ToastKind = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
}

interface ToastOptions {
  kind?: ToastKind;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
  success: (message: string, options?: Omit<ToastOptions, 'kind'>) => void;
  error: (message: string, options?: Omit<ToastOptions, 'kind'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const TONES = { success: 'text-online', error: 'text-danger', info: 'text-brand-300' } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = uid('toast');
      setItems((current) => [...current.slice(-2), { id, kind: options.kind ?? 'info', message, action: options.action }]);
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), options.duration ?? (options.action ? 6000 : 3600)),
      );
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message, options) => toast(message, { ...options, kind: 'success' }),
      error: (message, options) => toast(message, { ...options, kind: 'error' }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
        role="status"
        aria-live="polite"
      >
        {items.map((item) => {
          const Icon = ICONS[item.kind];
          return (
            <div
              key={item.id}
              className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-center gap-3 rounded-2xl border border-white/10 bg-ink-600 py-3 pl-4 pr-2 shadow-float"
            >
              <Icon className={cn('size-5 shrink-0', TONES[item.kind])} aria-hidden />
              <p className="min-w-0 flex-1 text-sm leading-snug text-white">{item.message}</p>
              {item.action && (
                <button
                  type="button"
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-200 transition-colors hover:bg-white/10"
                  onClick={() => {
                    item.action?.onClick();
                    dismiss(item.id);
                  }}
                >
                  {item.action.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Fechar aviso"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-mist transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => dismiss(item.id)}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  return context;
}
