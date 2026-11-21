import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { ME, useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { useCanCreateConnec } from '@/hooks/useCanCreateConnec';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/utils/cn';
import { activeGroups, firstUnseenIndex, type ConnecGroup } from '@/utils/connecs';
import { connecAge } from '@/utils/date';
import { firstName, plural } from '@/utils/format';
import { ConnecFace } from './ConnecFace';
import { ConnecViewer, type ViewerSequence } from './ConnecViewer';
import { Rail } from './Rail';

const CARD = 'relative block aspect-square w-full overflow-hidden rounded-2xl text-left focus-visible:outline-offset-[-3px]';

/** Carrossel de Connecs ativos no topo do feed: cartões quadrados, um por pessoa. */
export function ConnecsBar() {
  const { state, users } = useApp();
  const { openConnecComposer } = useUI();
  // Atualiza os tempos ("5s", "3min") e tira do carrossel o que completa 24 horas
  const now = useNow(1000);
  const seen = useMemo(() => new Set(state.seenConnecIds), [state.seenConnecIds]);
  const groups = useMemo(() => activeGroups(state.connecs, ME, seen, now), [state.connecs, seen, now]);
  const [viewer, setViewer] = useState<{ sequences: ViewerSequence[]; seq: number; index: number } | null>(null);

  const open = (position: number) => {
    // A ordem fica congelada enquanto o visualizador está aberto
    const sequences = groups.map((group) => ({
      key: group.authorId,
      ownerId: group.authorId,
      title: group.authorId === ME ? 'Você' : (users[group.authorId]?.name ?? 'Estudante'),
      connecs: group.connecs,
    }));
    setViewer({ sequences, seq: position, index: firstUnseenIndex(groups[position], seen) });
  };

  const mineActive = groups[0]?.authorId === ME ? groups[0].connecs.length : 0;
  const canCreate = useCanCreateConnec();

  return (
    <section aria-labelledby="connecs-title" className="mb-4">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h2 id="connecs-title" className="text-[0.9375rem] font-bold text-white">
          Connecs
        </h2>
      </div>

      {/* O histórico é aberto pelas Configurações. No computador, só se veem Connecs: criar é só no celular ou tablet. */}
      {(canCreate || groups.length > 0) && (
        <Rail label="Connecs das últimas 24 horas" className="-mx-3 px-3 sm:mx-0 sm:px-0">
          {canCreate && (
            <li className="rail-item">
              <button
                type="button"
                onClick={() => openConnecComposer()}
                className={cn(CARD, 'border border-dashed border-brand-400/50 bg-brand/10 transition-colors hover:bg-brand/20')}
              >
                <span className="flex size-full flex-col items-center justify-center gap-2 p-2 text-center">
                  <span className="btn-sun grid size-10 place-items-center rounded-full touch:size-8">
                    <Plus className="size-5 touch:size-[1.125rem]" strokeWidth={2.4} aria-hidden />
                  </span>
                  <span className="text-[0.8125rem] font-bold leading-tight text-white touch:text-xs">Novo Connec</span>
                  {mineActive > 0 && (
                    <span className="text-[0.6875rem] leading-tight text-mist">
                      {mineActive} {plural(mineActive, 'ativo', 'ativos')}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )}

          {groups.map((group, position) => (
            <GroupCard key={group.authorId} group={group} now={now} seen={seen} onOpen={() => open(position)} />
          ))}
        </Rail>
      )}

      {groups.length === 0 && (
        <p className="mt-2 text-[0.8125rem] text-mist">
          {canCreate ? 'Ninguém publicou Connecs nas últimas 24 horas. Que tal ser a primeira pessoa?' : 'Ninguém publicou Connecs nas últimas 24 horas.'}
        </p>
      )}

      {viewer && (
        <ConnecViewer
          sequences={viewer.sequences}
          startSequence={viewer.seq}
          startIndex={viewer.index}
          timeScale="active"
          onClose={() => setViewer(null)}
        />
      )}
    </section>
  );
}

function GroupCard({ group, now, seen, onOpen }: { group: ConnecGroup; now: number; seen: Set<string>; onOpen: () => void }) {
  const { users } = useApp();
  const author = users[group.authorId];
  if (!author) return null;
  const mine = group.authorId === ME;
  // Mostra o primeiro Connec ainda não visto; com tudo visto (ou nos próprios), o mais recente
  const shown = group.allSeen ? group.connecs[group.connecs.length - 1] : group.connecs[firstUnseenIndex(group, seen)];
  const name = mine ? 'Você' : firstName(author.name);
  const count = group.connecs.length;

  return (
    <li className="rail-item">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${mine ? 'Seus Connecs' : `Connecs de ${author.name}`}: ${count} ${plural(count, 'Connec', 'Connecs')}, o mais recente há ${connecAge(group.latestAt, now)}${group.allSeen || mine ? '' : ', com novidades'}`}
        className={cn(CARD, 'border border-line bg-ink-950')}
      >
        <ConnecFace connec={shown} textSize="xs" />
        <span className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-night/35" aria-hidden />
        {/* Não visto: contorno amarelo. Já visto: só a borda comum dos cards. */}
        {!group.allSeen && <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-[3px] ring-inset ring-sun" aria-hidden />}

        <span className="absolute left-2 top-2 flex items-center gap-1 touch:left-1.5 touch:top-1.5">
          <span className="rounded-md bg-night/55 px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-paper backdrop-blur">
            {connecAge(shown.createdAt, now)}
          </span>
          {count > 1 && <span className="rounded-md bg-night/55 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-paper backdrop-blur">{count}</span>}
        </span>

        <span className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 touch:inset-x-1.5 touch:bottom-1.5 touch:gap-1">
          <Avatar user={author} size="xs" className="rounded-squircle ring-2 ring-paper/80 touch:size-5" />
          <span className="truncate text-[0.8125rem] font-bold text-paper touch:text-xs">{name}</span>
        </span>
      </button>
    </li>
  );
}
