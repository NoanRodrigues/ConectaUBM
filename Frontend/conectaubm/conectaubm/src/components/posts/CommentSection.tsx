import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ChevronDown, ChevronUp, CornerDownRight, Heart, X } from 'lucide-react';
import { MentionSuggestions } from '@/components/mentions/MentionSuggestions';
import { Avatar } from '@/components/ui/Avatar';
import { ME, useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { usePolling } from '@/hooks/usePolling';
import { useMentionInput } from '@/hooks/useMentionInput';
import { COMMENT_MAX_LENGTH } from '@/services/postService';
import type { Comment, ID, ReplyTarget } from '@/types';
import { cn } from '@/utils/cn';
import { fullDate, timeAgo } from '@/utils/date';
import { firstName, plural } from '@/utils/format';
import { RichText } from './RichText';

interface CommentSectionProps {
  postId: ID;
  /** Na página da publicação todos os comentários e respostas ficam visíveis. */
  detail?: boolean;
  /**
   * Muda a cada clique no botão "Comentar" do card: a tela rola até o campo de comentário
   * e o cursor já fica nele. Com 0, nada acontece (por exemplo, ao abrir a página da publicação).
   */
  focusRequest?: number;
}

/** No feed aparecem as conversas mais recentes e as últimas respostas de cada uma. */
const PREVIEW_THREADS = 2;
const PREVIEW_REPLIES = 2;

interface Thread {
  root: Comment;
  replies: Comment[];
}

const byDate = (a: Comment, b: Comment) => a.createdAt.localeCompare(b.createdAt);

export function CommentSection({ postId, detail = false, focusRequest = 0 }: CommentSectionProps) {
  const { state, me, addComment, loadComments } = useApp();
  const [text, setText] = useState('');
  /** Comentário que está recebendo uma resposta agora. */
  const [replyingTo, setReplyingTo] = useState<ID | null>(null);
  /** Conversas com todas as respostas abertas no feed. */
  const [expanded, setExpanded] = useState<Set<ID>>(new Set());
  /** Conversas com as respostas recolhidas (só o comentário principal à mostra). */
  const [collapsed, setCollapsed] = useState<Set<ID>>(new Set());
  const setThreadCollapsed = (rootId: ID, value: boolean) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (value) next.add(rootId);
      else next.delete(rootId);
      return next;
    });
  const inputRef = useRef<HTMLInputElement>(null);
  const mention = useMentionInput({ value: text, setValue: setText, inputRef });

  // Os comentários vêm da API quando a conversa abre (no feed chega só o total)
  // e são conferidos de novo a cada poucos segundos enquanto ela está aberta.
  useEffect(() => {
    loadComments(postId).catch(() => undefined);
  }, [postId, loadComments]);
  usePolling(() => loadComments(postId), detail ? 5000 : 10000);

  useEffect(() => {
    if (!focusRequest) return;
    const input = inputRef.current;
    if (!input) return;
    // Foca sem o salto brusco do navegador e leva o campo, com suavidade, para o meio da tela
    input.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    input.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [focusRequest]);

  const threads = useMemo<Thread[]>(() => {
    const all = state.comments.filter((comment) => comment.postId === postId);
    const ids = new Set(all.map((comment) => comment.id));
    // Uma resposta cuja conversa foi removida volta a aparecer como comentário comum
    const isReply = (comment: Comment) => Boolean(comment.parentId && ids.has(comment.parentId));
    return all
      .filter((comment) => !isReply(comment))
      .sort(byDate)
      .map((root) => ({ root, replies: all.filter((comment) => isReply(comment) && comment.parentId === root.id).sort(byDate) }));
  }, [state.comments, postId]);

  const total = threads.reduce((sum, thread) => sum + 1 + thread.replies.length, 0);
  const visible = detail ? threads : threads.slice(-PREVIEW_THREADS);
  const hiddenThreads = threads.length - visible.length;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    addComment(postId, mention.serialize());
    setText('');
    mention.reset();
    inputRef.current?.focus();
  };

  const sendReply = (target: ReplyTarget, replyText: string) => {
    addComment(postId, replyText, target);
    setExpanded((current) => new Set(current).add(target.parentId));
    setThreadCollapsed(target.parentId, false);
    setReplyingTo(null);
  };

  return (
    <section className="mt-3 animate-fade-in border-t border-line pt-4" aria-label="Comentários">
      {hiddenThreads > 0 && (
        <Link to={`/post/${postId}`} className="mb-3 inline-block text-sm font-semibold text-brand-300 hover:underline">
          Ver {hiddenThreads === 1 ? 'mais 1 conversa' : `mais ${hiddenThreads} conversas`}
        </Link>
      )}

      {total === 0 && <p className="mb-4 text-sm text-mist">Ninguém comentou ainda. Comece a conversa.</p>}

      <ul className="space-y-4">
        {visible.map(({ root, replies }) => {
          const open = detail || expanded.has(root.id);
          const shown = open ? replies : replies.slice(-PREVIEW_REPLIES);
          const earlier = replies.length - shown.length;
          const isCollapsed = collapsed.has(root.id) && replyingTo !== root.id && !replies.some((reply) => reply.id === replyingTo);
          const repliesId = `respostas-${root.id}`;
          const count = replies.length === 1 ? '1 resposta' : `${replies.length} respostas`;
          return (
            <li key={root.id}>
              <CommentItem
                comment={root}
                onReply={() => {
                  setThreadCollapsed(root.id, false);
                  setReplyingTo(root.id);
                }}
              />

              {replies.length > 0 && isCollapsed && (
                <button
                  type="button"
                  aria-expanded={false}
                  aria-controls={repliesId}
                  className="ml-4 mt-2 flex items-center gap-1.5 text-[0.8125rem] font-semibold text-brand-300 hover:underline sm:ml-[1.125rem]"
                  onClick={() => {
                    setThreadCollapsed(root.id, false);
                    setExpanded((current) => new Set(current).add(root.id));
                  }}
                >
                  <ChevronDown className="size-4" aria-hidden />
                  Ver {count}
                </button>
              )}

              {!isCollapsed && (replies.length > 0 || replyingTo === root.id) && (
                <div id={repliesId} className="ml-4 mt-3 space-y-3 border-l-2 border-line pl-4 sm:ml-[1.125rem] sm:pl-5">
                  {earlier > 0 && (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-brand-300 hover:underline"
                      onClick={() => setExpanded((current) => new Set(current).add(root.id))}
                    >
                      <CornerDownRight className="size-3.5" aria-hidden />
                      Ver {earlier === 1 ? '1 resposta anterior' : `${earlier} respostas anteriores`}
                    </button>
                  )}
                  {shown.map((reply) => (
                    <div key={reply.id}>
                      <CommentItem comment={reply} isReply onReply={() => setReplyingTo(reply.id)} />
                      {replyingTo === reply.id && (
                        <ReplyForm
                          className="mt-2.5"
                          target={{ parentId: root.id, userId: reply.authorId, commentId: reply.id }}
                          onSend={sendReply}
                          onCancel={() => setReplyingTo(null)}
                        />
                      )}
                    </div>
                  ))}
                  {replyingTo === root.id && (
                    <ReplyForm target={{ parentId: root.id, userId: root.authorId, commentId: root.id }} onSend={sendReply} onCancel={() => setReplyingTo(null)} />
                  )}
                  {replies.length > 0 && replyingTo !== root.id && (
                    <button
                      type="button"
                      aria-expanded
                      aria-controls={repliesId}
                      className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-mist transition-colors hover:text-white"
                      onClick={() => {
                        setThreadCollapsed(root.id, true);
                        if (replies.some((reply) => reply.id === replyingTo)) setReplyingTo(null);
                      }}
                    >
                      <ChevronUp className="size-4" aria-hidden />
                      Ocultar {replies.length === 1 ? 'resposta' : 'respostas'}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <form onSubmit={submit} className={cn('flex items-center gap-2.5', total > 0 && 'mt-4')}>
        <Avatar user={me} size="sm" />
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={text}
            maxLength={COMMENT_MAX_LENGTH}
            {...mention.inputProps}
            onKeyDown={mention.onKeyDown}
            placeholder="Escreva um comentário"
            aria-label="Escreva um comentário"
            className="field h-10 rounded-full py-0 pl-4 pr-11"
          />
          <SendButton disabled={!text.trim()} label="Publicar comentário" />
          <MentionSuggestions list={mention.list} />
        </div>
      </form>
    </section>
  );
}

function SendButton({ disabled, label }: { disabled: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-label={label}
      className="btn-sun absolute right-1 top-1 grid size-8 place-items-center rounded-full transition-all disabled:scale-90 disabled:bg-none disabled:bg-white/10 disabled:text-mist disabled:shadow-none"
    >
      <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden />
    </button>
  );
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  onReply: () => void;
}

function CommentItem({ comment, isReply = false, onReply }: CommentItemProps) {
  const { users, deleteComment, toggleCommentLike } = useApp();
  const { toast } = useToast();
  const author = users[comment.authorId];
  if (!author) return null;
  const addressee = comment.replyToId && comment.replyToId !== comment.authorId ? users[comment.replyToId] : undefined;

  return (
    <div className="flex animate-msg-in gap-2.5">
      <Avatar user={author} size={isReply ? 'xs' : 'sm'} zoom className={cn('mt-0.5', isReply && 'size-7')} />
      <div className="min-w-0 flex-1">
        <div className={cn('inline-block max-w-full rounded-2xl rounded-tl-md px-3.5 py-2.5', isReply ? 'bg-ink-900' : 'bg-ink-700')}>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link to={`/perfil/${author.id}`} className="text-[0.8125rem] font-bold text-white hover:underline">
              {author.name}
            </Link>
            <span className="text-xs text-mist">{author.course}</span>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed text-white/90">
            {addressee && (
              <Link to={`/perfil/${addressee.id}`} className="mr-1 font-semibold text-brand-300 hover:underline">
                @{firstName(addressee.name)}
              </Link>
            )}
            <RichText text={comment.text} as="span" />
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 pl-2 text-xs font-semibold text-mist">
          <span className="font-normal" title={fullDate(comment.createdAt)}>
            {timeAgo(comment.createdAt)}
          </span>
          <button
            type="button"
            className={cn('inline-flex items-center gap-1 transition-colors hover:text-like', comment.likedByMe && 'text-like')}
            aria-pressed={comment.likedByMe}
            onClick={() => toggleCommentLike(comment.id)}
          >
            <Heart className={cn('size-3.5', comment.likedByMe && 'fill-like')} aria-hidden />
            {comment.likes > 0 ? `${comment.likes} ${plural(comment.likes, 'curtida', 'curtidas')}` : 'Curtir'}
          </button>
          <button type="button" className="transition-colors hover:text-white" onClick={onReply} aria-label={`Responder a ${author.name}`}>
            Responder
          </button>
          {comment.authorId === ME && (
            <button
              type="button"
              className="transition-colors hover:text-danger"
              onClick={() => {
                deleteComment(comment.id);
                toast(isReply ? 'Resposta excluída.' : 'Comentário excluído.');
              }}
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReplyFormProps {
  target: ReplyTarget;
  onSend: (target: ReplyTarget, text: string) => void;
  onCancel: () => void;
  className?: string;
}

/** Campo de resposta que abre dentro da conversa, logo abaixo do comentário respondido. */
function ReplyForm({ target, onSend, onCancel, className }: ReplyFormProps) {
  const { users, me } = useApp();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const mention = useMentionInput({ value: text, setValue: setText, inputRef });
  const name = firstName(users[target.userId]?.name ?? '');

  useEffect(() => {
    inputRef.current?.focus();
  }, [target.userId, target.parentId]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    onSend(target, mention.serialize());
  };

  return (
    <form onSubmit={submit} className={cn('flex animate-fade-in items-center gap-2', className)}>
      <Avatar user={me} size="xs" className="size-7" />
      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          value={text}
          maxLength={COMMENT_MAX_LENGTH}
          {...mention.inputProps}
          onKeyDown={(event) => {
            if (mention.onKeyDown(event)) return;
            if (event.key === 'Escape') onCancel();
          }}
          placeholder={`Responder a ${name}`}
          aria-label={`Responder a ${name}`}
          className="field h-10 rounded-full py-0 pl-4 pr-11"
        />
        <SendButton disabled={!text.trim()} label="Publicar resposta" />
        <MentionSuggestions list={mention.list} />
      </div>
      <button
        type="button"
        aria-label="Cancelar resposta"
        className="grid size-8 shrink-0 place-items-center rounded-full text-mist transition-colors hover:bg-white/10 hover:text-white"
        onClick={onCancel}
      >
        <X className="size-4" aria-hidden />
      </button>
    </form>
  );
}
