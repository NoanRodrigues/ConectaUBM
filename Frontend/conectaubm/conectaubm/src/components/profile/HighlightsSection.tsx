import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, Plus } from 'lucide-react';
import { ConnecFace } from '@/components/connecs/ConnecFace';
import { ConnecViewer } from '@/components/connecs/ConnecViewer';
import { Rail } from '@/components/connecs/Rail';
import { HighlightEditorModal } from '@/components/modals/HighlightEditorModal';
import { ME, useApp } from '@/context/AppContext';
import type { Highlight, User } from '@/types';
import { cn } from '@/utils/cn';
import { highlightCover, visibleHighlightConnecs } from '@/utils/connecs';
import { firstName, plural } from '@/utils/format';

const CARD = 'relative block aspect-square w-full overflow-hidden rounded-2xl border border-line bg-ink-950 text-left focus-visible:outline-offset-[-3px]';

/**
 * Destaques de Connecs no perfil. O visitante só vê os Connecs que a privacidade de cada um permite;
 * um destaque sem nenhum Connec visível para ele não aparece.
 */
export function HighlightsSection({ user }: { user: User }) {
  const { state } = useApp();
  const mine = user.id === ME;
  const [viewing, setViewing] = useState<Highlight | null>(null);
  const [editor, setEditor] = useState<{ highlight: Highlight | null } | null>(null);

  const entries = useMemo(
    () =>
      state.highlights
        .filter((highlight) => highlight.ownerId === user.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((highlight) => {
          const visible = visibleHighlightConnecs(highlight, state.connecs, ME);
          return { highlight, visible, cover: highlightCover(highlight, visible) };
        })
        .filter((entry) => mine || entry.visible.length > 0),
    [state.highlights, state.connecs, user.id, mine],
  );

  if (!mine && entries.length === 0) return null;

  const viewingEntry = viewing ? entries.find((entry) => entry.highlight.id === viewing.id) : undefined;

  return (
    <section className="card mt-4 p-4 sm:px-6" aria-labelledby="profile-highlights">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="profile-highlights" className="text-base font-bold text-white">
          Destaques
        </h2>
        {mine && (
          <Link to="/arquivo" className="text-[0.8125rem] font-semibold text-brand-300 hover:underline">
            Histórico e arquivo
          </Link>
        )}
      </div>

      <Rail label={mine ? 'Seus destaques' : `Destaques de ${firstName(user.name)}`} size="compact" className="-mx-4 px-4 sm:mx-0 sm:px-0">
        {mine && (
          <li className="rail-item">
            <button
              type="button"
              onClick={() => setEditor({ highlight: null })}
              className={cn(CARD, 'border-dashed border-brand-400/50 bg-brand/10 transition-colors hover:bg-brand/20')}
            >
              <span className="flex size-full flex-col items-center justify-center gap-1.5 p-2 text-center">
                <span className="btn-sun grid size-9 place-items-center rounded-full">
                  <Plus className="size-5" strokeWidth={2.4} aria-hidden />
                </span>
                <span className="text-[0.8125rem] font-bold leading-tight text-white">Novo destaque</span>
              </span>
            </button>
          </li>
        )}

        {entries.map(({ highlight, visible, cover }) => (
          <li key={highlight.id} className="rail-item relative">
            <button
              type="button"
              disabled={visible.length === 0}
              onClick={() => setViewing(highlight)}
              aria-label={`Destaque ${highlight.name}: ${visible.length} ${plural(visible.length, 'Connec', 'Connecs')}`}
              className={cn(CARD, 'disabled:cursor-default')}
            >
              <ConnecFace connec={cover.connec} imageUrl={cover.url} textSize="xs" />
              <span className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/10 to-transparent" aria-hidden />
              <span className="absolute inset-x-2 bottom-2">
                <span className="block truncate text-[0.8125rem] font-bold leading-tight text-paper">{highlight.name}</span>
                <span className="block text-[0.6875rem] text-paper/75">
                  {visible.length === 0 ? 'Vazio' : `${visible.length} ${plural(visible.length, 'Connec', 'Connecs')}`}
                </span>
              </span>
            </button>
            {mine && (
              <button
                type="button"
                aria-label={`Editar destaque ${highlight.name}`}
                onClick={() => setEditor({ highlight })}
                className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-night/55 text-paper backdrop-blur transition-colors hover:bg-night/75"
              >
                <PenLine className="size-4" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </Rail>

      {mine && entries.length === 0 && (
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-mist">
          Guarde no perfil os Connecs que não quer que sumam depois de 24 horas, como “Faculdade” ou “Projetos”.
        </p>
      )}

      {viewingEntry && (
        <ConnecViewer
          sequences={[
            {
              key: viewingEntry.highlight.id,
              ownerId: user.id,
              title: viewingEntry.highlight.name,
              subtitle: mine ? 'Seu destaque' : user.name,
              connecs: viewingEntry.visible,
            },
          ]}
          timeScale="archive"
          highlightId={mine ? viewingEntry.highlight.id : undefined}
          onClose={() => setViewing(null)}
        />
      )}

      {editor && <HighlightEditorModal highlight={editor.highlight} onClose={() => setEditor(null)} />}
    </section>
  );
}
