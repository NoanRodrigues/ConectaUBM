import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Users } from 'lucide-react';
import { ConnecsBar } from '@/components/connecs/ConnecsBar';
import { ComposerCard } from '@/components/feed/ComposerCard';
import { FeedAside } from '@/components/feed/FeedAside';
import { PostCard } from '@/components/posts/PostCard';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState, PostSkeleton } from '@/components/ui/Feedback';
import { PillTabs } from '@/components/ui/Tabs';
import { ME, useApp } from '@/context/AppContext';
import { usePolling } from '@/hooks/usePolling';
import type { ID } from '@/types';
import { buildFeed } from '@/utils/feed';

type Scope = 'all' | 'friends';

export function FeedPage() {
  const { state, myConnectionIds, refreshFeed } = useApp();
  const [scope, setScope] = useState<Scope>('all');
  const [loading, setLoading] = useState(true);

  // Busca as novidades ao abrir a página e ao trocar de aba. O que já veio no login aparece na hora.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    refreshFeed(scope)
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [scope, refreshFeed]);
  // Publicações novas entram no topo; curtidas e comentários dos outros se atualizam
  usePolling(() => refreshFeed(scope), 15000);

  // A ordem do feed é definida ao abrir a página (ou trocar de aba) e não muda sozinha depois:
  // curtir, comentar ou repostar deixa cada publicação onde está. Só publicações novas entram, no topo.
  // Na próxima visita, o feed volta a ser ordenado pelo evento mais recente (incluindo os seus reposts).
  // Uma publicação arquivada guarda o lugar: se for desarquivada, volta para a mesma posição, não para o topo.
  const orderRef = useRef<{ scope: Scope; ids: ID[] } | null>(null);
  const items = useMemo(() => {
    const built = buildFeed(state, { scope, meId: ME, connectionIds: myConnectionIds });
    const previous = orderRef.current?.scope === scope ? orderRef.current.ids : null;
    if (!previous) {
      orderRef.current = { scope, ids: built.map((item) => item.post.id) };
      return built;
    }
    const byId = new Map(built.map((item) => [item.post.id, item]));
    const known = new Set(previous);
    const archived = new Set(state.posts.filter((post) => post.archivedAt).map((post) => post.id));
    const ids = [
      ...built.filter((item) => !known.has(item.post.id)).map((item) => item.post.id),
      ...previous.filter((id) => byId.has(id) || archived.has(id)),
    ];
    orderRef.current = { scope, ids };
    return ids.flatMap((id) => byId.get(id) ?? []);
  }, [state, scope, myConnectionIds]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,40rem)_22rem] xl:justify-between">
      <div className="min-w-0">
        <h1 className="sr-only">Início</h1>
        <ConnecsBar />

        <ComposerCard />

        <div className="sticky top-[67px] z-20 -mx-3 mt-4 bg-ink/90 px-3 py-2.5 backdrop-blur-xl sm:mx-0 sm:px-0 md:static md:bg-transparent md:p-0 md:backdrop-blur-none">
          <PillTabs<Scope>
            label="Qual feed mostrar"
            value={scope}
            onChange={setScope}
            items={[
              { id: 'all', label: 'Geral' },
              { id: 'friends', label: 'Meus amigos' },
            ]}
          />
        </div>

        <div className="mt-2 space-y-4 md:mt-4" aria-busy={loading && items.length === 0}>
          {loading && items.length === 0 ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : items.length === 0 ? (
            <div className="card">
              {scope === 'friends' ? (
                <EmptyState
                  icon={Users}
                  title="Seu feed de amigos ainda está vazio"
                  description="Conecte-se com colegas para ver aqui só as publicações de quem você conhece."
                  action={
                    <Link to="/explorar" className={buttonClass('primary')}>
                      Descobrir pessoas
                    </Link>
                  }
                />
              ) : (
                <EmptyState icon={Compass} title="Nada por aqui ainda" description="Seja a primeira pessoa a publicar algo hoje." />
              )}
            </div>
          ) : (
            <div key={scope} className="animate-fade-in space-y-4">
              {items.map((item) => (
                // A chave é o id da publicação: o card não é recriado quando ela ganha ou perde a faixa de repost
                <PostCard key={item.post.id} post={item.post} repost={item.repost} />
              ))}
              <p className="py-6 text-center text-sm text-mist">Você viu tudo por enquanto.</p>
            </div>
          )}
        </div>
      </div>

      <aside className="hidden lg:block" aria-label="Sugestões e assuntos em alta">
        <FeedAside />
      </aside>
    </div>
  );
}
