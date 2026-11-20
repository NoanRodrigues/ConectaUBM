import type { KeyboardEvent, MouseEvent } from 'react';
import { useOptionalUI } from '@/context/UIContext';
import type { ID, User } from '@/types';
import { avatarOf } from '@/utils/avatar';
import { cn } from '@/utils/cn';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZES: Record<AvatarSize, string> = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-20',
  '2xl': 'size-24 sm:size-32',
};

const DOTS: Record<AvatarSize, string> = {
  xs: 'size-2 ring-1',
  sm: 'size-2.5 ring-2',
  md: 'size-3 ring-2',
  lg: 'size-3.5 ring-[3px]',
  xl: 'size-4 ring-[3px]',
  '2xl': 'size-5 ring-4',
};

interface AvatarProps {
  user: Pick<User, 'name' | 'avatarUrl' | 'avatarSeed' | 'online'> & { id?: ID };
  size?: AvatarSize;
  /** Mostra o indicador de "online" quando o estudante está ativo. */
  showStatus?: boolean;
  /**
   * Clicar amplia a foto. O clique não chega ao link ou cartão em volta,
   * então o resto do item (nome, cartão) continua levando ao perfil.
   */
  zoom?: boolean;
  className?: string;
}

/** Avatar em "squircle": a forma que identifica as pessoas no ConectaUBM. */
export function Avatar({ user, size = 'md', showStatus = false, zoom = false, className }: AvatarProps) {
  const ui = useOptionalUI();
  const zoomable = zoom && Boolean(user.id) && ui !== null;

  const enlarge = (event: MouseEvent | KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (user.id) ui?.openAvatar(user.id);
  };

  return (
    <span
      className={cn('relative inline-block shrink-0', SIZES[size], zoomable && 'cursor-zoom-in rounded-squircle', className)}
      {...(zoomable
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-label': `Ampliar a foto de ${user.name}`,
            onClick: enlarge,
            onKeyDown: (event: KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') enlarge(event);
            },
          }
        : {})}
    >
      <img
        src={avatarOf(user)}
        alt=""
        loading="lazy"
        draggable={false}
        className="size-full rounded-squircle bg-sky object-cover"
      />
      {showStatus && user.online && (
        <span className={cn('absolute -bottom-0.5 -right-0.5 rounded-full bg-online ring-ink-800', DOTS[size])}>
          <span className="sr-only">Online</span>
        </span>
      )}
    </span>
  );
}

interface AvatarStackProps {
  users: Array<Pick<User, 'id' | 'name' | 'avatarUrl' | 'avatarSeed' | 'online'>>;
  max?: number;
}

export function AvatarStack({ users, max = 3 }: AvatarStackProps) {
  return (
    <span className="flex -space-x-1.5">
      {users.slice(0, max).map((user) => (
        <Avatar key={user.id} user={user} size="xs" className="rounded-squircle ring-2 ring-ink-800" />
      ))}
    </span>
  );
}
