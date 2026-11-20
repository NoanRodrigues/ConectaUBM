import type { User } from '@/types';
import { cn } from '@/utils/cn';

interface AcademicLineProps {
  user: Pick<User, 'course' | 'period'>;
  className?: string;
  /** Mostra "4º" em vez de "4º período". */
  compact?: boolean;
}

/**
 * Curso + período. O período é opcional: quando o estudante não informa,
 * só o curso aparece.
 */
export function AcademicLine({ user, className, compact = false }: AcademicLineProps) {
  return (
    <span className={cn('flex min-w-0 items-center gap-1.5 text-[0.8125rem] text-fog', className)}>
      <span className="truncate">{user.course}</span>
      {user.period && (
        <span
          className="shrink-0 rounded-md bg-brand-800 px-1.5 py-px text-[0.6875rem] font-bold leading-[1.15rem] text-brand-100"
          title={`${user.period}º período`}
        >
          {user.period}º{!compact && ' período'}
        </span>
      )}
    </span>
  );
}
