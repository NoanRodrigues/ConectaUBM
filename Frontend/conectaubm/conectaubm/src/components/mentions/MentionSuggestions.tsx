import { IdCard } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { ME } from '@/context/AppContext';
import type { MentionList } from '@/hooks/useMentionInput';
import type { User } from '@/types';
import { cn } from '@/utils/cn';
import { usernameOf } from '@/utils/users';

interface MentionSuggestionsProps {
  list: MentionList;
  /** Abre acima do campo (conversas, campo no rodapé) ou abaixo (publicação, comentário). */
  placement?: 'top' | 'bottom';
  /** Nas conversas: envia o perfil como cartão em vez de mencionar. */
  onShareProfile?: (user: User) => void;
  className?: string;
}

/** Lista de pessoas que aparece ao digitar @. O contêiner do campo precisa ser `relative`. */
export function MentionSuggestions({ list, placement = 'bottom', onShareProfile, className }: MentionSuggestionsProps) {
  if (!list.open) return null;
  return (
    <ul
      id={list.id}
      role="listbox"
      aria-label="Marcar alguém"
      className={cn(
        'absolute inset-x-0 z-40 max-h-64 animate-menu-in overflow-y-auto rounded-2xl border border-white/10 bg-ink-600 p-1.5 shadow-float',
        placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
        className,
      )}
      // Mantém o foco no campo (no celular, o teclado não fecha ao tocar numa sugestão)
      onPointerDown={(event) => event.preventDefault()}
    >
      {list.items.map((user, index) => {
        const active = index === list.activeIndex;
        return (
          <li
            key={user.id}
            id={`${list.id}-${index}`}
            role="option"
            aria-selected={active}
            onPointerEnter={() => list.setActiveIndex(index)}
            onClick={() => list.pick(user)}
            className={cn('flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors', active ? 'bg-white/[0.09]' : 'hover:bg-white/[0.05]')}
          >
            <Avatar user={user} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-1.5">
                <span className="truncate text-sm font-semibold text-white">{user.name}</span>
                {user.id === ME && <span className="shrink-0 text-xs text-mist">(você)</span>}
              </span>
              <span className="block truncate text-xs text-mist">
                @{usernameOf(user)} · {user.course}
              </span>
            </span>
            {onShareProfile && (
              <button
                type="button"
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-brand-400/40 bg-brand/15 px-2.5 text-xs font-semibold text-brand-100 transition-colors hover:bg-brand/35"
                aria-label={`Enviar o perfil de ${user.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onShareProfile(user);
                }}
              >
                <IdCard className="size-3.5" aria-hidden />
                <span className="max-[359px]:hidden">Enviar perfil</span>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
