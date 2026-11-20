import type { ID, User } from '@/types';
import { firstName } from './format';

/**
 * Menções no texto salvo: `@[id]`, ligadas ao id real do usuário.
 * Na tela, viram "@Nome" com o nome atual da pessoa e link para o perfil.
 * `@{me}` é o formato antigo dos dados de demonstração (menção ao usuário logado) e continua aceito.
 *
 * Integração futura: o backend extrai os ids com MENTION_ID e grava na tabela `mention`
 * (ver docs/banco-de-dados.sql) para notificar quem foi marcado.
 */
export const MENTION_ID = /@\[([A-Za-z0-9_-]+)\]/g;
export const LEGACY_ME = '@{me}';

/** Partes para renderização: hashtags, menções novas e a menção antiga ao usuário logado. */
export const RICH_TOKEN = /(#[\p{L}\p{N}_]+|@\{me\}|@\[[A-Za-z0-9_-]+\])/gu;

export function mentionToken(userId: ID): string {
  return `@[${userId}]`;
}

/** Ids marcados no texto (sem repetição). */
export function mentionedIds(text: string, meId?: ID): ID[] {
  const ids = [...text.matchAll(MENTION_ID)].map((match) => match[1]);
  if (meId && text.includes(LEGACY_ME)) ids.push(meId);
  return [...new Set(ids)];
}

/** Rótulo de uma menção na tela. */
export function mentionLabel(user: Pick<User, 'name'> | undefined): string {
  return user ? `@${user.name}` : '@usuário';
}

/** Texto puro para prévias, notificações e compartilhamento. */
export function toPlainText(text: string, users: Record<ID, User>, meId: ID): string {
  return text
    .replace(/@\{me\}/g, `@${firstName(users[meId]?.name ?? '')}`)
    .replace(MENTION_ID, (_, id: string) => mentionLabel(users[id]));
}

export interface InsertedMention {
  userId: ID;
  label: string;
}

/**
 * Converte o texto digitado (com "@Nome" visível) para o formato salvo (`@[id]`).
 * Só vira menção o que foi escolhido na lista de sugestões e continua escrito igual;
 * se a pessoa editou o nome no meio, aquilo volta a ser texto comum.
 */
export function serializeMentions(text: string, inserted: InsertedMention[]): string {
  let result = text;
  for (const mention of inserted) {
    const visible = `@${mention.label}`;
    const index = result.indexOf(visible);
    if (index === -1) continue;
    result = result.slice(0, index) + mentionToken(mention.userId) + result.slice(index + visible.length);
  }
  return result;
}
