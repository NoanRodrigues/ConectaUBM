import { useNavigate } from 'react-router-dom';
import { Play, Repeat2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { ME, useApp } from '@/context/AppContext';
import type { ID } from '@/types';
import { cn } from '@/utils/cn';
import { fullDate, timeAgo } from '@/utils/date';
import { usernameOf } from '@/utils/users';
import { RichText } from './RichText';

interface QuotedPostProps {
  postId: ID;
  /** Fora da prévia, clicar abre a publicação original. */
  interactive?: boolean;
  className?: string;
}

/**
 * Publicação original embutida num repost com comentário (como no X).
 * Sempre mostra o autor verdadeiro. Se a original foi excluída ou arquivada, avisa que não está disponível.
 */
export function QuotedPost({ postId, interactive = true, className }: QuotedPostProps) {
  const { state, users } = useApp();
  const navigate = useNavigate();
  const post = state.posts.find((entry) => entry.id === postId);
  const author = post ? users[post.authorId] : undefined;
  const available = post && author && (!post.archivedAt || post.authorId === ME);

  if (!available) {
    return (
      <div className={cn('rounded-2xl border border-line bg-ink-850 px-4 py-3.5 text-sm text-mist', className)}>
        Esta publicação não está mais disponível.
      </div>
    );
  }

  const cover = post.media[0];
  const thumb = cover ? (cover.type === 'video' ? cover.poster : cover.url) : undefined;
  const open = () => navigate(`/post/${post.id}`);

  return (
    <div
      role={interactive ? 'link' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Publicação original de ${author.name}` : undefined}
      onClick={(event) => {
        // Links de dentro (menções, hashtags) continuam funcionando sozinhos
        if (!interactive || (event.target as HTMLElement).closest('a,button')) return;
        open();
      }}
      onKeyDown={(event) => {
        if (interactive && event.key === 'Enter' && event.target === event.currentTarget) open();
      }}
      className={cn(
        'overflow-hidden rounded-2xl border border-line bg-ink-850 transition-colors',
        interactive && 'cursor-pointer hover:border-white/20 hover:bg-white/[0.03]',
        className,
      )}
    >
      <div className="p-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar user={author} size="xs" zoom />
          <span className="truncate text-sm font-bold text-white">{author.name}</span>
          <span className="hidden truncate text-xs text-mist sm:inline">@{usernameOf(author)}</span>
          <span className="shrink-0 text-xs text-mist" title={fullDate(post.createdAt)}>
            · {timeAgo(post.createdAt)}
          </span>
        </div>
        {post.text && <RichText text={post.text} className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-white/90" />}
        {post.quotedPostId && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-mist">
            <Repeat2 className="size-3.5" aria-hidden /> Repost com comentário
          </p>
        )}
      </div>
      {thumb && (
        <div className="relative border-t border-line">
          <img src={thumb} alt={cover.alt} className="aspect-[2/1] w-full object-cover" loading="lazy" />
          {cover.type === 'video' && (
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-10 place-items-center rounded-full bg-night/70 text-paper">
                <Play className="size-5 fill-current" aria-hidden />
              </span>
            </span>
          )}
          {post.media.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-md bg-night/70 px-1.5 py-0.5 text-xs font-semibold text-paper">+{post.media.length - 1}</span>
          )}
        </div>
      )}
    </div>
  );
}
