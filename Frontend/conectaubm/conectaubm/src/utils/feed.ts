import type { AppState, FeedItem, ID, Post, Repost } from '@/types';

interface FeedOptions {
  /** 'all': toda a comunidade. 'friends': só conexões (e o próprio usuário). */
  scope: 'all' | 'friends';
  meId: ID;
  connectionIds: ID[];
}

/**
 * Monta o feed: cada publicação aparece uma vez, na posição do evento mais recente
 * (a própria publicação ou o repost de alguém do escopo).
 */
export function buildFeed(state: AppState, { scope, meId, connectionIds }: FeedOptions): FeedItem[] {
  const circle = new Set<ID>([meId, ...connectionIds]);
  const hidden = new Set(state.hiddenPostIds);
  const latestRepost = new Map<ID, Repost>();

  for (const repost of state.reposts) {
    if (scope === 'friends' && !circle.has(repost.userId)) continue;
    const current = latestRepost.get(repost.postId);
    if (!current || repost.createdAt > current.createdAt) latestRepost.set(repost.postId, repost);
  }

  const items: FeedItem[] = [];
  for (const post of state.posts) {
    if (hidden.has(post.id) || isArchived(post)) continue;
    const repost = latestRepost.get(post.id);
    const authorInScope = scope === 'all' || circle.has(post.authorId);
    if (!authorInScope && !repost) continue;
    // O repost só "puxa" o post para cima quando é mais novo e de alguém próximo.
    const promoted = repost && circle.has(repost.userId) && repost.createdAt > post.createdAt ? repost : undefined;
    if (!authorInScope && !promoted) continue;
    items.push({
      key: promoted ? `${post.id}:${promoted.id}` : post.id,
      post,
      repost: promoted,
      sortDate: promoted ? promoted.createdAt : post.createdAt,
    });
  }
  return items.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}

/** Publicação arquivada: fica fora do feed, do perfil e da busca, sem perder nada. */
export function isArchived(post: Post): boolean {
  return Boolean(post.archivedAt);
}

export function postsBy(state: AppState, userId: ID): Post[] {
  return state.posts.filter((post) => post.authorId === userId && !isArchived(post)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function repostsBy(state: AppState, userId: ID): FeedItem[] {
  const items: FeedItem[] = [];
  for (const repost of state.reposts) {
    if (repost.userId !== userId) continue;
    const post = state.posts.find((entry) => entry.id === repost.postId);
    if (post && !isArchived(post)) items.push({ key: repost.id, post, repost, sortDate: repost.createdAt });
  }
  return items.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}

/** Publicações arquivadas pelo autor, das arquivadas mais recentemente para as mais antigas. */
export function archivedBy(state: AppState, userId: ID): Post[] {
  return state.posts
    .filter((post) => post.authorId === userId && isArchived(post))
    .sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''));
}
