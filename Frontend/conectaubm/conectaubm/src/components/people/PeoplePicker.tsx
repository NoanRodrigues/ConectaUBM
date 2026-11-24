import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { ME, useApp } from '@/context/AppContext';
import type { ID, User } from '@/types';
import { cn } from '@/utils/cn';
import { normalize } from '@/utils/format';
import { usernameOf } from '@/utils/users';

interface PeoplePickerProps {
  selected: ID[];
  onToggle: (userId: ID) => void;
  /** Quem não aparece na lista (ex.: quem já está no grupo). */
  exclude?: ID[];
  /** Motivo para não poder escolher alguém (aparece no lugar do curso e a linha fica desativada). */
  unavailable?: (user: User) => string | null;
  /** Altura máxima da lista. */
  listClassName?: string;
}

/**
 * Busca e seleção de estudantes (por nome, nome de usuário ou curso), com as conexões primeiro.
 * Usado na privacidade dos Connecs e nas conversas em grupo.
 */
export function PeoplePicker({ selected, onToggle, exclude = [], unavailable, listClassName = 'max-h-56' }: PeoplePickerProps) {
  const { users, myConnectionIds } = useApp();
  const [filter, setFilter] = useState('');
  const chosen = new Set(selected);

  // Conexões primeiro, depois o resto da comunidade, em ordem alfabética
  const people = useMemo(() => {
    const connected = new Set(myConnectionIds);
    const hidden = new Set([ME, ...exclude]);
    return Object.values(users)
      .filter((user) => !hidden.has(user.id))
      .sort((a, b) => Number(connected.has(b.id)) - Number(connected.has(a.id)) || a.name.localeCompare(b.name));
  }, [users, myConnectionIds, exclude]);

  const term = normalize(filter.replace(/^@/, ''));
  const visible = people.filter((user) => normalize(`${user.name} ${usernameOf(user)} ${user.course}`).includes(term));

  return (
    <div>
      <div className="relative mb-1.5">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" aria-hidden />
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Buscar estudante"
          aria-label="Buscar estudante"
          className="field h-10 rounded-lg pl-9 text-sm [&::-webkit-search-cancel-button]:hidden"
        />
      </div>
      <ul className={cn('space-y-0.5 overflow-y-auto pr-0.5', listClassName)}>
        {visible.map((user) => {
          const checked = chosen.has(user.id);
          const blocked = unavailable?.(user) ?? null;
          return (
            <li key={user.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-disabled={Boolean(blocked) || undefined}
                onClick={() => !blocked && onToggle(user.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-1.5 py-1.5 text-left transition-colors',
                  blocked ? 'cursor-not-allowed opacity-55' : 'hover:bg-white/[0.05]',
                )}
              >
                <Avatar user={user} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
                  <span className="block truncate text-xs text-mist">{blocked ?? user.course}</span>
                </span>
                <span
                  className={cn(
                    'grid size-5 shrink-0 place-items-center rounded-md border transition-colors',
                    checked ? 'theme-dark border-brand-400 bg-brand-500 text-white' : 'border-white/25 text-transparent',
                  )}
                  aria-hidden
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              </button>
            </li>
          );
        })}
        {visible.length === 0 && <li className="px-2 py-3 text-sm text-mist">Ninguém com “{filter.trim()}”.</li>}
      </ul>
    </div>
  );
}
