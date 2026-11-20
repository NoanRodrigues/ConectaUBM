import { createAvatar } from '@dicebear/core';
import * as notionists from '@dicebear/notionists';
import type { User } from '@/types';
import { hashString } from './format';

/**
 * Avatares ilustrados gerados localmente (DiceBear "Notionists", licença CC0).
 * Evitam imagens quebradas enquanto o estudante não envia uma foto.
 */
const TINTS = ['c9d7f2', 'd9d4f5', 'bcd0f5', 'e3e8f7', 'cbdcee', 'd3cdf0'];
const cache = new Map<string, string>();

export function illustratedAvatar(seed: string): string {
  const cached = cache.get(seed);
  if (cached) return cached;
  const uri = createAvatar(notionists, {
    seed,
    backgroundColor: [TINTS[hashString(seed) % TINTS.length]],
    beardProbability: 0,
  }).toDataUri();
  cache.set(seed, uri);
  return uri;
}

export function avatarOf(user: Pick<User, 'avatarUrl' | 'avatarSeed'>): string {
  return user.avatarUrl || illustratedAvatar(user.avatarSeed);
}

/** Opções oferecidas em "Editar perfil" para quem não quer usar foto. */
export const AVATAR_CHOICES = [
  'Igor', 'Caio', 'Sofia', 'ubm19', 'Helena', 'Vitor', 'ubm30', 'ubm15',
  'Nicole', 'Pedro', 'ubm39', 'ubm23', 'Yasmin', 'ubm35', 'Aline', 'ubm8',
];
