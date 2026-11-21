import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  EyeOff,
  Flag,
  Heart,
  Link2,
  MessageCircle,
  MessageSquareQuote,
  MoreHorizontal,
  Repeat2,
  Send,
  SquareArrowOutUpRight,
  Trash2,
} from 'lucide-react';
import { AcademicLine } from '@/components/ui/Academic';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Menu } from '@/components/ui/Menu';
import { Tooltip } from '@/components/ui/Tooltip';
import { ME, useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { useUI } from '@/context/UIContext';
import { copyText } from '@/services/shareService';
import type { Post, Repost } from '@/types';
import { cn } from '@/utils/cn';
import { fullDate, timeAgo } from '@/utils/date';
import { appLink, compact, firstName, plural } from '@/utils/format';
import { usernameOf } from '@/utils/users';
import { CommentSection } from './CommentSection';
import { PostMedia } from './PostMedia';
import { QuotedPost } from './QuotedPost';
import { plainText, RichText } from './RichText';

interface PostCardProps {
  post: Post;
  /** Quando o post chegou ao feed porque alguém repostou. */
  repost?: Repost;
  /** Página da publicação: texto inteiro e todos os comentários abertos. */
  detail?: boolean;
  /** Prévia no criador de publicações: sem ações. */
  preview?: boolean;
}

const LONG_TEXT = 360;

export function PostCard({ post, repost, detail = false, preview = false }: PostCardProps) {
  const { users, state, toggleLike, toggleRepost, deletePost, setPostHidden, setPostArchived } = useApp();
  const { success, toast, error } = useToast();
  const { openShare, openComposer } = useUI();
  const repostAnchor = useRef<HTMLSpanElement>(null);
  const navigate = useNavigate();
  const [commentsOpen, setCommentsOpen] = useState(detail);
  /** Conta os cliques em "Comentar" que abrem a área de comentários (ver CommentSection.focusRequest). */
  const [commentFocus, setCommentFocus] = useState(0);
  const [expanded, setExpanded] = useState(detail || preview);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [burst, setBurst] = useState(0);

  const author = users[post.authorId];
  if (!author) return null;

  const mine = post.authorId === ME;
  // O total vem da API; antes disso (ou num post só local), conta os comentários carregados.
  const commentCount = post.commentCount ?? state.comments.filter((comment) => comment.postId === post.id).length;
  const postPath = `/post/${post.id}`;
  const profilePath = `/perfil/${author.id}`;
  const isLong = post.text.length > LONG_TEXT;
  const reposter = repost ? users[repost.userId] : null;
  // Reposts com comentário contam junto com os simples no botão de repost
  const quoteCount = state.posts.filter((entry) => entry.quotedPostId === post.id && !entry.archivedAt).length;
  const repostTotal = post.reposts + quoteCount;
  const quoted = post.quotedPostId ? state.posts.find((entry) => entry.id === post.quotedPostId) : undefined;
  const quotedAuthor = quoted ? users[quoted.authorId] : undefined;
  const archived = Boolean(post.archivedAt);

  const handleLike = () => {
    if (!post.likedByMe) setBurst((value) => value + 1);
    toggleLike(post.id);
  };

  /**
   * Repostar pode mudar a altura do que está acima do botão (a faixa "Você repostou", por exemplo).
   * Depois da mudança, a rolagem é corrigida para o botão ficar exatamente onde estava na tela.
   */
  const keepInPlace = (anchor: HTMLElement, action: () => void) => {
    const before = anchor.getBoundingClientRect().top;
    action();
    requestAnimationFrame(() => {
      if (!anchor.isConnected) return;
      const shift = anchor.getBoundingClientRect().top - before;
      if (Math.abs(shift) > 1) window.scrollBy({ top: shift, behavior: 'instant' });
    });
  };

  const handleRepost = (anchor: HTMLElement) => {
    keepInPlace(anchor, () => {
      const reposted = toggleRepost(post.id);
      if (reposted) {
        success('Repostado no seu perfil.', { action: { label: 'Desfazer', onClick: () => keepInPlace(anchor, () => toggleRepost(post.id)) } });
      } else {
        toast('Repost removido do seu perfil.');
      }
    });
  };


  const handleCopy = async () => {
    const ok = await copyText(appLink(postPath));
    if (ok) success('Link da publicação copiado.');
    else error('Não foi possível copiar o link. Copie pela barra de endereço.');
  };

  const handleShare = () => {
    openShare({
      heading: 'Compartilhar publicação',
      postId: post.id,
      title: `Publicação de ${author.name} no ConectaUBM`,
      text: plainText(post.text, users).slice(0, 140) || `Veja a publicação de ${author.name} no ConectaUBM`,
      url: appLink(postPath),
    });
  };

  const handleArchive = () => {
    setPostArchived(post.id, true);
    success('Publicação arquivada. Só você vê, em Arquivo.', { action: { label: 'Desfazer', onClick: () => setPostArchived(post.id, false) } });
  };

  const handleUnarchive = () => {
    setPostArchived(post.id, false);
    success('Publicação desarquivada. Ela voltou ao feed e ao seu perfil.');
  };

  const handleHide = () => {
    setPostHidden(post.id, true);
    toast('Publicação ocultada do seu feed.', { action: { label: 'Desfazer', onClick: () => setPostHidden(post.id, false) } });
    if (detail) navigate('/');
  };

  const actionClass =
    'group/action flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-fog transition-colors hover:bg-white/[0.06] sm:flex-none sm:px-3.5';

  return (
    <article className={cn('card', preview && 'pointer-events-none border-dashed')} aria-label={`Publicação de ${author.name}`}>
      {archived && !preview && (
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-[0.8125rem] font-medium text-mist sm:px-5">
          <Archive className="size-4 text-brand-300" aria-hidden />
          <span>Arquivada · só você vê</span>
          <button type="button" className="ml-auto font-semibold text-brand-300 hover:underline" onClick={handleUnarchive}>
            Desarquivar
          </button>
        </div>
      )}

      {reposter && repost && (
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-[0.8125rem] font-medium text-mist sm:px-5">
          <Repeat2 className="size-4 text-brand-300" aria-hidden />
          <Link to={`/perfil/${reposter.id}`} className="font-semibold text-fog hover:text-white hover:underline">
            {reposter.id === ME ? 'Você' : reposter.name}
          </Link>
          <span>repostou</span>
          <span className="ml-auto" title={fullDate(repost.createdAt)}>
            {timeAgo(repost.createdAt)}
          </span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <header className="flex items-start gap-3">
          <Avatar user={author} showStatus zoom className="transition-transform hover:scale-105" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <Link to={profilePath} className="truncate text-[0.9375rem] font-bold leading-tight text-white hover:underline">
                {author.name}
              </Link>
              <Link
                to={postPath}
                className="shrink-0 text-xs text-mist hover:text-white hover:underline"
                title={fullDate(post.createdAt)}
                aria-label={`Publicado em ${fullDate(post.createdAt)}. Abrir publicação.`}
              >
                {timeAgo(post.createdAt)}
              </Link>
            </div>
            <AcademicLine user={author} className="mt-0.5" />
          </div>
          {!preview && (
            <Menu
              label="Opções da publicação"
              buttonClassName="-mr-2 -mt-1 grid size-9 place-items-center rounded-xl text-mist transition-colors hover:bg-white/[0.08] hover:text-white"
              items={[
                !detail && { label: 'Abrir publicação', icon: SquareArrowOutUpRight, onSelect: () => navigate(postPath) },
                { label: 'Copiar link', icon: Link2, onSelect: handleCopy },
                !mine && { label: `Ocultar publicação`, icon: EyeOff, onSelect: handleHide },
                !mine && {
                  label: 'Denunciar',
                  icon: Flag,
                  onSelect: () => success(`Denúncia enviada. Vamos analisar a publicação de ${firstName(author.name)}.`),
                },
                mine && !archived && { label: 'Arquivar publicação', icon: Archive, onSelect: handleArchive },
                mine && archived && { label: 'Desarquivar publicação', icon: ArchiveRestore, onSelect: handleUnarchive },
                mine && { label: 'Excluir publicação', icon: Trash2, danger: true, separated: true, onSelect: () => setConfirmDelete(true) },
              ]}
            >
              <MoreHorizontal className="size-5" aria-hidden />
            </Menu>
          )}
        </header>

        {post.text && (
          <div className="mt-3.5">
            <RichText text={post.text} className={cn('text-[0.9375rem] leading-relaxed text-white/95', !expanded && isLong && 'line-clamp-5')} />
            {!expanded && isLong && (
              <button type="button" className="mt-1 text-sm font-semibold text-brand-300 hover:underline" onClick={() => setExpanded(true)}>
                Ver mais
              </button>
            )}
          </div>
        )}

        {post.media.length > 0 && (
          <div className="mt-3.5">
            <PostMedia media={post.media} interactive={!preview} />
          </div>
        )}

        {post.quotedPostId && (
          <div className="mt-3.5">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-mist">
              <Repeat2 className="size-3.5 text-brand-300" aria-hidden />
              {quotedAuthor ? `Repostou de @${usernameOf(quotedAuthor)}` : 'Repost com comentário'}
            </p>
            <QuotedPost postId={post.quotedPostId} interactive={!preview} />
          </div>
        )}

        <div className={cn('-mx-1.5 mt-3 flex items-center gap-1 sm:-mx-2', preview && 'opacity-50')} aria-hidden={preview}>
          <Tooltip label={post.likedByMe ? 'Descurtir' : 'Curtir'} side="top" className="flex-1 sm:flex-none">
            <button
              type="button"
              className={cn(actionClass, post.likedByMe ? 'text-like hover:bg-like/10' : 'hover:text-like')}
              aria-pressed={post.likedByMe}
              aria-label={`Curtir. ${post.likes} ${plural(post.likes, 'curtida', 'curtidas')}`}
              onClick={handleLike}
            >
              <span className="relative grid place-items-center">
                {burst > 0 && post.likedByMe && (
                  <span key={burst} className="absolute size-6 animate-burst rounded-full border-2 border-like" aria-hidden />
                )}
                <Heart
                  key={`${burst}-${post.likedByMe}`}
                  className={cn('size-5', post.likedByMe && 'animate-heart fill-like')}
                  aria-hidden
                />
              </span>
              <span className="tabular-nums">{compact(post.likes)}</span>
            </button>
          </Tooltip>

          <Tooltip label="Comentar" side="top" className="flex-1 sm:flex-none">
            <button
              type="button"
              className={cn(actionClass, 'hover:text-brand-200', commentsOpen && 'text-brand-200')}
              aria-expanded={commentsOpen}
              aria-label={`Comentar. ${commentCount} ${plural(commentCount, 'comentário', 'comentários')}`}
              onClick={() => {
                const opening = detail || !commentsOpen;
                setCommentsOpen(opening);
                if (opening) setCommentFocus((count) => count + 1);
              }}
            >
              <MessageCircle className="size-5" aria-hidden />
              <span className="tabular-nums">{compact(commentCount)}</span>
            </button>
          </Tooltip>

          <Tooltip label="Repostar" side="top" className="flex-1 sm:flex-none">
            <span ref={repostAnchor} className="flex flex-1">
              <Menu
                label={`Repostar. ${repostTotal} ${plural(repostTotal, 'repost', 'reposts')}${post.repostedByMe ? '. Você já repostou' : ''}`}
                className="flex flex-1"
                buttonClassName={cn(actionClass, 'w-full', post.repostedByMe ? 'text-online hover:bg-online/10' : 'hover:text-online')}
                items={[
                  {
                    label: post.repostedByMe ? 'Desfazer repost' : 'Repostar',
                    icon: Repeat2,
                    onSelect: () => repostAnchor.current && handleRepost(repostAnchor.current),
                  },
                  {
                    label: 'Repostar com comentário',
                    icon: MessageSquareQuote,
                    onSelect: () => openComposer('text', { text: '', media: [], quotedPostId: post.id }),
                  },
                ]}
              >
                <Repeat2 className={cn('size-5 transition-transform duration-300', post.repostedByMe && 'rotate-180')} aria-hidden />
                <span className="tabular-nums">{compact(repostTotal)}</span>
              </Menu>
            </span>
          </Tooltip>

          <Tooltip label="Compartilhar" side="top" className="flex-1 sm:flex-none">
            <button
              type="button"
              className={cn(actionClass, 'hover:text-brand-200')}
              aria-label={`Compartilhar. ${post.shares} ${plural(post.shares, 'compartilhamento', 'compartilhamentos')}`}
              onClick={handleShare}
            >
              <Send className="size-[1.125rem]" aria-hidden />
              <span className="tabular-nums">{compact(post.shares)}</span>
            </button>
          </Tooltip>

          <Tooltip label="Copiar link" side="top" className="ml-auto hidden sm:inline-flex">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl text-fog transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Copiar link da publicação"
              onClick={handleCopy}
            >
              <Link2 className="size-5" aria-hidden />
            </button>
          </Tooltip>
        </div>

        {commentsOpen && !preview && <CommentSection postId={post.id} detail={detail} focusRequest={commentFocus} />}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir publicação?"
        description="A publicação, as curtidas e os comentários serão removidos do feed e do seu perfil. Não dá para desfazer."
        confirmLabel="Excluir publicação"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deletePost(post.id);
          success('Publicação excluída.');
          if (detail) navigate('/');
        }}
      />
    </article>
  );
}
