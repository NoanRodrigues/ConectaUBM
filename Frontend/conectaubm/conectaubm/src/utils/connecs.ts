import type { Connec, ConnecBackground, ConnecPrivacy, Highlight, ID } from '@/types';

/**
 * Regras dos Connecs, sem dependência de React.
 * Com o backend, o servidor passa a aplicar as mesmas regras (expiração e privacidade);
 * estas funções continuam úteis para a interface decidir o que mostrar.
 */

export const CONNEC_TTL_MS = 24 * 60 * 60 * 1000;
export const CONNEC_TEXT_MAX = 150;
export const HIGHLIGHT_NAME_MAX = 30;
/** Tempo de exibição de cada Connec no visualizador. */
export const CONNEC_SLIDE_MS = 6000;

/** Criação de Connecs só em celulares e tablets (ver utils/device.ts). */
export const CONNEC_MOBILE_ONLY = 'Connecs são criados pelo celular ou tablet. No computador, você pode ver Connecs, destaques e o seu histórico.';

export const PUBLIC_PRIVACY: ConnecPrivacy = { audience: 'everyone', userIds: [] };

/** Classes do fundo dos Connecs só de texto. Todas vêm da paleta já usada no ConectaUBM. */
export const CONNEC_BACKGROUNDS: Record<ConnecBackground, { label: string; className: string; text: string }> = {
  navy: { label: 'Azul-marinho', className: 'navy-surface', text: 'text-paper' },
  brand: { label: 'Azul UBM', className: 'bg-gradient-to-br from-[#2463a8] to-[#06204a]', text: 'text-paper' },
  sun: { label: 'Amarelo', className: 'bg-gradient-to-br from-[#ffc533] to-sun', text: 'text-night' },
};

/**
 * A mídia "preenche adequadamente a tela" quando é vertical e tem proporção próxima à da área de exibição:
 * no máximo 25% de diferença, o que recorta só as bordas. Mais que isso (fotos horizontais, quadradas ou 3:4
 * numa tela alta), ela aparece inteira sobre um fundo, sem esticar nem cortar conteúdo.
 * Proporções = largura / altura.
 */
export const FILL_TOLERANCE = 0.25;

export function mediaFillsFrame(mediaRatio: number, frameRatio: number): boolean {
  if (mediaRatio >= 1 || frameRatio <= 0) return false;
  return Math.abs(mediaRatio - frameRatio) / frameRatio <= FILL_TOLERANCE;
}

export function expiresAtFor(createdAt: string): string {
  return new Date(new Date(createdAt).getTime() + CONNEC_TTL_MS).toISOString();
}

/** Ativo = dentro das 24 h. Expirar não apaga o registro (histórico e destaques continuam). */
export function isActive(connec: Connec, now = Date.now()): boolean {
  return new Date(connec.expiresAt).getTime() > now;
}

/** Privacidade individual de cada Connec. O autor sempre vê o que publicou. */
export function canView(connec: Pick<Connec, 'authorId' | 'privacy'>, viewerId: ID): boolean {
  if (connec.authorId === viewerId) return true;
  const { audience, userIds } = connec.privacy;
  if (audience === 'only') return userIds.includes(viewerId);
  if (audience === 'except') return !userIds.includes(viewerId);
  return true;
}

export function privacyLabel(privacy: ConnecPrivacy): string {
  const count = privacy.userIds.length;
  const people = `${count} ${count === 1 ? 'pessoa' : 'pessoas'}`;
  if (privacy.audience === 'only') return `Somente ${people}`;
  if (privacy.audience === 'except') return `Todos exceto ${people}`;
  return 'Todos';
}

export interface ConnecGroup {
  authorId: ID;
  /** Do mais antigo para o mais novo: a ordem em que são assistidos. */
  connecs: Connec[];
  latestAt: string;
  allSeen: boolean;
}

/**
 * Connecs ativos que o usuário pode ver, agrupados por autor.
 * Ordem: os do próprio usuário primeiro, depois quem tem algo não visto (mais recentes antes)
 * e por fim quem já foi visto.
 */
export function activeGroups(connecs: Connec[], viewerId: ID, seen: Set<ID>, now = Date.now()): ConnecGroup[] {
  const byAuthor = new Map<ID, Connec[]>();
  for (const connec of connecs) {
    if (!isActive(connec, now) || !canView(connec, viewerId)) continue;
    const list = byAuthor.get(connec.authorId) ?? [];
    list.push(connec);
    byAuthor.set(connec.authorId, list);
  }
  const groups: ConnecGroup[] = [];
  byAuthor.forEach((list, authorId) => {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    groups.push({
      authorId,
      connecs: list,
      latestAt: list[list.length - 1].createdAt,
      allSeen: authorId === viewerId || list.every((connec) => seen.has(connec.id)),
    });
  });
  const rank = (group: ConnecGroup) => (group.authorId === viewerId ? 0 : group.allSeen ? 2 : 1);
  return groups.sort((a, b) => rank(a) - rank(b) || b.latestAt.localeCompare(a.latestAt));
}

/** Primeiro Connec ainda não visto do grupo (ou o primeiro, se todos já foram vistos). */
export function firstUnseenIndex(group: ConnecGroup, seen: Set<ID>): number {
  const index = group.connecs.findIndex((connec) => !seen.has(connec.id));
  return index === -1 ? 0 : index;
}

/** Histórico do autor: todos os Connecs dele, ativos ou não, do mais novo para o mais antigo. */
export function historyOf(connecs: Connec[], authorId: ID): Connec[] {
  return connecs.filter((connec) => connec.authorId === authorId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Itens do destaque que o visitante pode ver, na ordem em que foram adicionados. */
export function visibleHighlightConnecs(highlight: Highlight, connecs: Connec[], viewerId: ID): Connec[] {
  const byId = new Map(connecs.map((connec) => [connec.id, connec]));
  return [...highlight.items]
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt))
    .flatMap((item) => byId.get(item.connecId) ?? [])
    .filter((connec) => canView(connec, viewerId));
}

/**
 * Capa do destaque. Sem capa escolhida (ou se o Connec da capa saiu do destaque),
 * vale o Connec adicionado por último — que muda sozinho quando entra um novo.
 */
export function highlightCover(highlight: Highlight, visible: Connec[]): { url: string | null; connec: Connec | null } {
  const { cover } = highlight;
  if (cover?.kind === 'upload') return { url: cover.url, connec: null };
  if (cover?.kind === 'connec') {
    const chosen = visible.find((connec) => connec.id === cover.connecId);
    if (chosen) return { url: chosen.media?.url ?? null, connec: chosen };
  }
  const latest = visible[visible.length - 1] ?? null;
  return { url: latest?.media?.url ?? null, connec: latest };
}

/** Ids dos Connecs que estão em algum destaque do dono. */
export function highlightedIds(highlights: Highlight[]): Set<ID> {
  return new Set(highlights.flatMap((highlight) => highlight.items.map((item) => item.connecId)));
}
