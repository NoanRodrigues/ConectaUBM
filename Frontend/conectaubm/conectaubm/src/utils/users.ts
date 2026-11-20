import type { ID, User } from '@/types';
import { normalize } from './format';

/**
 * Nome de usuário exibido como @fulano.sobrenome.
 * Usa o campo `username` quando existir; senão deriva do nome (sem acentos, minúsculo, com ponto).
 * Integração futura: o backend passa a devolver o `username` único de cada conta.
 */
export function usernameOf(user: Pick<User, 'name' | 'username'>): string {
  if (user.username) return user.username;
  return (
    normalize(user.name)
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .join('.') || 'estudante'
  );
}

interface SearchOptions {
  /** Restringe a busca (ex.: participantes de um grupo). */
  only?: ID[];
  exclude?: ID[];
  /** Ids que aparecem primeiro (ex.: conexões). */
  priority?: ID[];
  limit?: number;
}

/** Busca por nome ou nome de usuário. Quem começa com o termo aparece antes de quem só o contém. */
export function searchUsers(users: Record<ID, User>, query: string, options: SearchOptions = {}): User[] {
  const term = normalize(query.trim().replace(/^@/, ''));
  const only = options.only ? new Set(options.only) : null;
  const exclude = new Set(options.exclude ?? []);
  const priority = new Set(options.priority ?? []);

  const scored = Object.values(users)
    .filter((user) => (!only || only.has(user.id)) && !exclude.has(user.id))
    .map((user) => {
      const name = normalize(user.name);
      const handle = usernameOf(user);
      let score = -1;
      if (!term) score = 1;
      else if (name.startsWith(term) || handle.startsWith(term)) score = 3;
      else if (name.split(' ').some((part) => part.startsWith(term))) score = 2;
      else if (name.includes(term) || handle.includes(term)) score = 1;
      return { user, score };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(priority.has(b.user.id)) - Number(priority.has(a.user.id)) ||
        a.user.name.localeCompare(b.user.name),
    )
    .map((entry) => entry.user);

  return options.limit ? scored.slice(0, options.limit) : scored;
}
