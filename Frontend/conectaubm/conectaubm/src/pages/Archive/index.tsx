import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Archive, Bookmark, History, Lock, Plus } from 'lucide-react';
import { ConnecFace } from '@/components/connecs/ConnecFace';
import { ConnecViewer } from '@/components/connecs/ConnecViewer';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { PillTabs } from '@/components/ui/Tabs';
import { ME, useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { useCanCreateConnec } from '@/hooks/useCanCreateConnec';
import { useNow } from '@/hooks/useNow';
import type { Connec } from '@/types';
import { highlightedIds, historyOf, isActive, privacyLabel } from '@/utils/connecs';
import { connecAge, fullDate, monthYear } from '@/utils/date';
import { archivedBy } from '@/utils/feed';
import { plural } from '@/utils/format';

type Tab = 'connecs' | 'posts';

/**
 * Arquivo pessoal (só o dono vê):
 * - Histórico de Connecs: tudo o que já foi publicado, independente das 24 horas.
 * - Publicações arquivadas: saíram do feed e do perfil, mas não foram excluídas.
 */
export function ArchivePage() {
  const { state, loadArchive } = useApp();
  const { openConnecComposer } = useUI();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('aba') === 'publicacoes' ? 'posts' : 'connecs';
  const now = useNow(30_000);
  const canCreate = useCanCreateConnec();
  const [viewing, setViewing] = useState<number | null>(null);

  // Histórico completo de Connecs e publicações arquivadas vêm da API ao abrir.
  useEffect(() => {
    loadArchive().catch(() => undefined);
  }, [loadArchive]);

  const history = useMemo(() => historyOf(state.connecs, ME), [state.connecs]);
  const archived = useMemo(() => archivedBy(state, ME), [state]);
  const inHighlights = useMemo(() => highlightedIds(state.highlights.filter((highlight) => highlight.ownerId === ME)), [state.highlights]);

  // Agrupa por mês para facilitar encontrar fotos antigas
  const months = useMemo(() => {
    const groups: Array<{ label: string; items: Array<{ connec: Connec; position: number }> }> = [];
    history.forEach((connec, position) => {
      const label = monthYear(connec.createdAt);
      const last = groups[groups.length - 1];
      if (last?.label === label) last.items.push({ connec, position });
      else groups.push({ label, items: [{ connec, position }] });
    });
    return groups;
  }, [history]);

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-[1.6rem] font-bold leading-tight text-white sm:text-[1.85rem]">Arquivo</h1>
        <p className="mt-1 text-[0.9375rem] text-fog">Só você vê esta página: seus Connecs antigos e as publicações que você tirou do feed.</p>
      </header>

      <PillTabs<Tab>
        className="mt-5"
        label="Seções do arquivo"
        value={tab}
        onChange={(next) => setParams(next === 'posts' ? { aba: 'publicacoes' } : {}, { replace: true })}
        items={[
          { id: 'connecs', label: 'Histórico de Connecs', count: history.length },
          { id: 'posts', label: 'Publicações arquivadas', count: archived.length },
        ]}
      />

      <div key={tab} className="mt-4 animate-fade-in">
        {tab === 'connecs' &&
          (history.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={History}
                title="Seu histórico está vazio"
                description={
                    canCreate
                      ? 'Todo Connec que você publicar fica guardado aqui, mesmo depois das 24 horas.'
                      : 'Todo Connec que você publicar pelo celular ou tablet fica guardado aqui, mesmo depois das 24 horas.'
                }
                action={
                  canCreate && <Button variant="accent" icon={<Plus className="size-4" aria-hidden />} onClick={() => openConnecComposer()}>
                    Novo Connec
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-6">
              {months.map((month) => (
                <section key={month.label} aria-label={month.label}>
                  <h2 className="mb-2.5 text-sm font-bold text-white">{month.label.charAt(0).toUpperCase() + month.label.slice(1)}</h2>
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
                    {month.items.map(({ connec, position }) => {
                      const active = isActive(connec, now);
                      return (
                        <li key={connec.id}>
                          <button
                            type="button"
                            onClick={() => setViewing(position)}
                            title={`Publicado em ${fullDate(connec.createdAt)}`}
                            aria-label={`Connec de ${fullDate(connec.createdAt)}${active ? ', ainda ativo' : ''}${inHighlights.has(connec.id) ? ', em destaque' : ''}. ${privacyLabel(connec.privacy)}.`}
                            className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-line bg-ink-950 focus-visible:outline-offset-[-3px]"
                          >
                            <ConnecFace connec={connec} textSize="xs" />
                            <span className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent" aria-hidden />
                            <span className="absolute right-1.5 top-1.5 flex gap-1" aria-hidden>
                              {inHighlights.has(connec.id) && (
                                <span className="grid size-6 place-items-center rounded-full bg-night/55 text-sun backdrop-blur">
                                  <Bookmark className="size-3.5 fill-current" />
                                </span>
                              )}
                              {connec.privacy.audience !== 'everyone' && (
                                <span className="grid size-6 place-items-center rounded-full bg-night/55 text-paper backdrop-blur">
                                  <Lock className="size-3.5" />
                                </span>
                              )}
                            </span>
                            <span className="absolute bottom-1.5 left-1.5 flex flex-wrap gap-1">
                              <span className="rounded-md bg-night/60 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-paper">
                                {new Date(connec.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                              </span>
                              {active && (
                                <span className="rounded-md bg-sun px-1.5 py-0.5 text-[0.6875rem] font-bold text-night">Ativo · {connecAge(connec.createdAt, now)}</span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
              <p className="text-center text-[0.8125rem] text-mist">
                {history.length} {plural(history.length, 'Connec publicado', 'Connecs publicados')}.{' '}
                {canCreate ? 'Toque em um para ver, salvar em destaque ou publicar de novo.' : 'Clique em um para ver ou salvar em destaque.'}
              </p>
            </div>
          ))}

        {tab === 'posts' &&
          (archived.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Archive}
                title="Nenhuma publicação arquivada"
                description="No menu “…” de uma publicação sua, use Arquivar para tirá-la do feed sem excluir."
              />
            </div>
          ) : (
            <div className="space-y-4">
              {archived.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ))}
      </div>

      {viewing !== null && (
        <ConnecViewer
          sequences={[{ key: 'history', ownerId: ME, title: 'Seu histórico', connecs: history }]}
          startIndex={viewing}
          timeScale="archive"
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
