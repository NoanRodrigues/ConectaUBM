import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Spinner } from './Spinner';
import { Tooltip } from './Tooltip';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'theme-dark bg-brand text-white hover:bg-brand-500 active:bg-brand-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]',
  accent: 'btn-sun',
  secondary: 'border border-white/10 bg-white/[0.05] text-white hover:bg-white/10 hover:border-white/20',
  subtle: 'bg-brand/20 text-brand-100 hover:bg-brand/35',
  ghost: 'text-fog hover:bg-white/[0.07] hover:text-white',
  danger: 'bg-danger/15 text-danger hover:bg-danger/25',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[0.8125rem]',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-[0.9375rem]',
};

/** Classes de botão, para aplicar também em <Link>. */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string): string {
  return cn(
    'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Nome acessível e texto da dica. */
  label: string;
  tooltip?: 'top' | 'bottom' | 'left' | 'none';
  size?: 'sm' | 'md';
  badge?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, tooltip = 'bottom', size = 'md', badge, className, children, type = 'button', ...rest },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type={type}
      aria-label={badge ? `${label} (${badge})` : label}
      className={cn(
        'relative grid shrink-0 place-items-center rounded-xl text-fog transition-colors hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-50',
        size === 'md' ? 'size-10' : 'size-8',
        className,
      )}
      {...rest}
    >
      {children}
      {badge ? <CountBadge count={badge} className="absolute -right-0.5 -top-0.5" /> : null}
    </button>
  );
  return tooltip === 'none' ? button : <Tooltip label={label} side={tooltip}>{button}</Tooltip>;
});

export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-like px-1 text-[0.6875rem] font-bold leading-none text-night ring-2 ring-ink',
        className,
      )}
      aria-hidden
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
