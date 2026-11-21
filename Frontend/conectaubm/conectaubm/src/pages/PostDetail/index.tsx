import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileX2 } from 'lucide-react';
import { PostCard } from '@/components/posts/PostCard';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState, PostSkeleton } from '@/components/ui/Feedback';
import { ME, useApp } from '@/context/AppContext';
import { usePolling } from '@/hooks/usePolling';

/** Visualização de uma publicação, com todos os comentários. */
export function PostDetailPage() {
  const { postId } = useParams();
  const { state, loadPost } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Sempre confere na API: a publicação pode ter mudado (curtidas, arquivada, excluída).
  useEffect(() => {
    if (!postId) return;
    let alive = true;
    setLoading(true);
    loadPost(postId)
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [postId, loadPost]);
  // Curtidas, reposts e o total de comentários de quem está vendo agora
  usePolling(() => (postId ? loadPost(postId) : Promise.resolve()), 8000, Boolean(postId));
  const found = state.posts.find((entry) => entry.id === postId);
  // Arquivada, a publicação só abre para quem publicou
  const post = found && (!found.archivedAt || found.authorId === ME) ? found : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        className="mb-4 inline-flex h-10 items-center gap-2 rounded-xl pl-2 pr-3.5 text-sm font-semibold text-fog transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <ArrowLeft className="size-[1.125rem]" aria-hidden />
        Voltar
      </button>

      <h1 className="sr-only">Publicação</h1>

      {post ? (
        <PostCard post={post} detail />
      ) : loading ? (
        <PostSkeleton />
      ) : (
        <div className="card">
          <EmptyState
            icon={FileX2}
            title="Publicação não encontrada"
            description="Ela pode ter sido excluída por quem publicou."
            action={
              <Link to="/" className={buttonClass('primary')}>
                Ir para o feed
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
