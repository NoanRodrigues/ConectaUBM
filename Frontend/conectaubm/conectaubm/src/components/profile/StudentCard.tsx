import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { AcademicLine } from '@/components/ui/Academic';
import { Avatar, AvatarStack } from '@/components/ui/Avatar';
import { buttonClass } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Form';
import { useApp } from '@/context/AppContext';
import type { ID, User } from '@/types';
import { cn } from '@/utils/cn';
import { firstName } from '@/utils/format';
import { ConnectButton } from './ConnectButton';

/** "3 conexões em comum", com os avatares de quem conecta vocês. */
export function MutualLine({ userId, className, short = false }: { userId: ID; className?: string; short?: boolean }) {
  const { users, mutualsOf } = useApp();
  const mutuals = mutualsOf(userId)
    .map((id) => users[id])
    .filter(Boolean);
  if (mutuals.length === 0) return null;
  const names = mutuals.slice(0, 2).map((user) => firstName(user.name));
  const rest = mutuals.length - names.length;
  return (
    <span className={cn('flex items-center gap-2 text-xs text-mist', className)}>
      <AvatarStack users={mutuals} />
      <span className="truncate">
        {short
          ? `${mutuals.length} em comum`
          : `${rest > 0 ? `${names.join(', ')} e mais ${rest}` : names.join(' e ')} em comum`}
      </span>
    </span>
  );
}

interface StudentCardProps {
  user: User;
  className?: string;
  /** Mostra o X para dispensar a sugestão. */
  onDismiss?: () => void;
}

/** X discreto no canto do cartão ou da linha de uma sugestão. */
export function DismissButton({ user, onDismiss, className }: { user: User; onDismiss: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label={`Dispensar sugestão de ${user.name}`}
      title="Dispensar sugestão"
      className={cn('absolute grid size-7 place-items-center rounded-full text-mist transition-colors hover:bg-white/10 hover:text-white', className)}
    >
      <X className="size-4" aria-hidden />
    </button>
  );
}

/** Card de descoberta: quem é, o que estuda, do que gosta e como se conectar. */
export function StudentCard({ user, className, onDismiss }: StudentCardProps) {
  const { me } = useApp();
  const shared = new Set(me.interests);
  const interests = [...user.interests].sort((a, b) => Number(shared.has(b)) - Number(shared.has(a)));
  const profilePath = `/perfil/${user.id}`;

  return (
    <article className={cn('card relative flex animate-fade-in flex-col p-4 transition-colors duration-200 hover:border-white/20 hover:bg-ink-700/70', className)}>
      {onDismiss && <DismissButton user={user} onDismiss={onDismiss} className="right-2 top-2" />}
      <Link to={profilePath} className={cn('flex items-center gap-3.5 rounded-xl', onDismiss && 'pr-7')}>
        <Avatar user={user} size="lg" showStatus zoom />
        <span className="min-w-0">
          <span className="block truncate text-base font-bold leading-tight text-white">{user.name}</span>
          <AcademicLine user={user} className="mt-1" compact />
        </span>
      </Link>

      <p className="mt-3.5 line-clamp-2 min-h-[2.6rem] text-sm leading-snug text-fog">{user.bio}</p>

      <div className="mt-3 flex h-6 flex-wrap gap-1.5 overflow-hidden">
        {interests.slice(0, 3).map((interest) => (
          <Chip key={interest} size="sm" active={shared.has(interest)}>
            {interest}
          </Chip>
        ))}
        {interests.length > 3 && <Chip size="sm">+{interests.length - 3}</Chip>}
      </div>

      <div className="mt-3 flex min-h-6 items-center">
        <MutualLine userId={user.id} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <ConnectButton userId={user.id} size="sm" />
        <Link to={profilePath} className={buttonClass('secondary', 'sm')}>
          Ver perfil
        </Link>
      </div>
    </article>
  );
}

interface StudentRowProps {
  user: User;
  /** Linha de apoio sob o curso (conexões em comum, interesse que bateu com a busca…). */
  detail?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Linha compacta para listas: pesquisa, sugestões e amigos. */
export function StudentRow({ user, detail, action, className }: StudentRowProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Link to={`/perfil/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl">
        <Avatar user={user} showStatus zoom />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-bold leading-tight text-white">{user.name}</span>
          <AcademicLine user={user} className="mt-0.5" compact />
          {detail && <span className="mt-1 block">{detail}</span>}
        </span>
      </Link>
      <div className="shrink-0">{action ?? <ConnectButton userId={user.id} size="sm" compact />}</div>
    </div>
  );
}
