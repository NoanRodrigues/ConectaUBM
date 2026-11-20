import { useId, type ReactNode } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FieldProps {
  label: string;
  /** Texto auxiliar à direita do rótulo, como "opcional". */
  hint?: string;
  error?: string;
  /** Recebe o id do controle e o id da mensagem de erro para associar ao campo. */
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined }) => ReactNode;
  className?: string;
  footer?: ReactNode;
}

/** Rótulo + controle + mensagem de erro, já associados para leitores de tela. */
export function Field({ label, hint, error, children, className, footer }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.8125rem] font-semibold text-fog">
          {label}
        </label>
        {hint && <span className="text-xs text-mist">{hint}</span>}
      </div>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? errorId : undefined })}
      {error ? (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] text-danger" role="alert">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        footer
      )}
    </div>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-[0.9375rem] font-semibold text-white">
          {label}
        </label>
        {description && <p className="mt-0.5 text-sm leading-snug text-mist">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50',
          checked ? 'bg-brand-500' : 'bg-white/25',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 size-5 rounded-full bg-paper shadow transition-transform duration-200',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  );
}

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}

export function Checkbox({ checked, onChange, children }: CheckboxProps) {
  return (
    <label className="group inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-fog">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span
        className={cn(
          'grid size-5 place-items-center rounded-md border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-300',
          checked ? 'border-brand-400 theme-dark bg-brand-500 text-white' : 'border-white/25 bg-transparent text-transparent group-hover:border-white/40',
        )}
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
      {children}
    </label>
  );
}

interface ChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

/** Etiqueta de interesse. Vira botão quando recebe onClick. */
export function Chip({ children, active = false, onClick, className, size = 'md' }: ChipProps) {
  const classes = cn(
    'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium transition-colors',
    size === 'md' ? 'h-8 px-3 text-[0.8125rem]' : 'h-6 px-2.5 text-xs',
    active ? 'border-brand-400 bg-brand/40 text-white' : 'border-white/10 bg-white/[0.04] text-fog',
    onClick && !active && 'hover:border-white/25 hover:text-white',
    className,
  );
  if (onClick) {
    return (
      <button type="button" className={classes} aria-pressed={active} onClick={onClick}>
        {active && <Check className="size-3.5" strokeWidth={2.5} aria-hidden />}
        {children}
      </button>
    );
  }
  return <span className={classes}>{children}</span>;
}
