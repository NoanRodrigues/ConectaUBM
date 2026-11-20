import type { GroupChat, GroupMember, GroupMessage, ID, User } from '@/types';

/**
 * Regras de permissão dos grupos, sem dependência de React.
 * São as mesmas que o backend deve aplicar (o frontend só esconde o que não pode):
 *
 * - Criador: é admin enquanto estiver no grupo e não pode ser removido nem rebaixado.
 * - Admin: muda nome e foto, adiciona pessoas, remove participantes comuns e promove a admin.
 * - Só o criador remove outros admins ou tira deles a função de admin.
 * - Qualquer participante vê a lista, envia mensagens e sai quando quiser.
 * - Se o último admin sai, o participante mais antigo vira admin, para o grupo nunca ficar sem gestão.
 */

export const GROUP_NAME_MAX = 50;
/** Além de quem cria: "duas ou mais pessoas". */
export const GROUP_MIN_INVITES = 2;
export const GROUP_MAX_MEMBERS = 50;

export function memberOf(group: GroupChat, userId: ID): GroupMember | undefined {
  return group.members.find((member) => member.userId === userId);
}

export function isMember(group: GroupChat, userId: ID): boolean {
  return Boolean(memberOf(group, userId));
}

export function isAdmin(group: GroupChat, userId: ID): boolean {
  return memberOf(group, userId)?.role === 'admin';
}

export function canEditInfo(group: GroupChat, actorId: ID): boolean {
  return isAdmin(group, actorId);
}

export function canAddMembers(group: GroupChat, actorId: ID): boolean {
  return isAdmin(group, actorId) && group.members.length < GROUP_MAX_MEMBERS;
}

export function canRemove(group: GroupChat, actorId: ID, targetId: ID): boolean {
  const target = memberOf(group, targetId);
  if (!target || actorId === targetId || targetId === group.createdBy || !isAdmin(group, actorId)) return false;
  return target.role === 'member' || actorId === group.createdBy;
}

export function canPromote(group: GroupChat, actorId: ID, targetId: ID): boolean {
  return isAdmin(group, actorId) && memberOf(group, targetId)?.role === 'member';
}

export function canDemote(group: GroupChat, actorId: ID, targetId: ID): boolean {
  return actorId === group.createdBy && targetId !== group.createdBy && memberOf(group, targetId)?.role === 'admin';
}

/**
 * Pode entrar num grupo por convite de quem convida?
 * Respeita a privacidade de mensagens: quem só aceita conversas de conexões só entra se for conexão.
 */
export function canBeInvited(user: User | undefined, isConnection: boolean): boolean {
  if (!user) return false;
  return user.messagePolicy === 'everyone' || isConnection;
}

/** Participantes depois da saída de alguém, garantindo pelo menos um admin. */
export function membersAfterLeaving(group: GroupChat, userId: ID): GroupMember[] {
  const remaining = group.members.filter((member) => member.userId !== userId);
  if (remaining.length === 0 || remaining.some((member) => member.role === 'admin')) return remaining;
  const oldest = [...remaining].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0];
  return remaining.map((member) => (member === oldest ? { ...member, role: 'admin' as const } : member));
}

/** Última mensagem que vale para a prévia na lista de conversas. */
export function lastGroupMessage(group: GroupChat): GroupMessage | undefined {
  return group.messages[group.messages.length - 1];
}

/** "Você, Thiago, Marina e mais 2" */
export function membersSummary(group: GroupChat, users: Record<ID, User>, meId: ID): string {
  const names = [...group.members]
    .sort((a, b) => Number(b.userId === meId) - Number(a.userId === meId))
    .map((member) => (member.userId === meId ? 'Você' : (users[member.userId]?.name.split(' ')[0] ?? 'Estudante')));
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} e mais ${names.length - 3}`;
}
