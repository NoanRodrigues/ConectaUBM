import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookmarkPlus,
  BookmarkX,
  ChevronLeft,
  ChevronRight,
  Globe2,
  History,
  ImagePlus,
  Lock,
  MoreHorizontal,
  Pause,
  Play,
  Repeat2,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ConnecFace } from '@/components/connecs/ConnecFace';
import { ConnecPrivacyModal } from '@/components/modals/ConnecPrivacyModal';
import { HighlightPickerModal } from '@/components/modals/HighlightPickerModal';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Menu } from '@/components/ui/Menu';
import { ME, useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { useUI } from '@/context/UIContext';
import { useCanCreateConnec } from '@/hooks/useCanCreateConnec';
import { useNow } from '@/hooks/useNow';
import type { Connec, ID } from '@/types';
import { cn } from '@/utils/cn';
import { CONNEC_SLIDE_MS, privacyLabel } from '@/utils/connecs';
import { connecAge, fullDate, highlightAge } from '@/utils/date';
import { uid } from '@/utils/format';
import { lockScroll } from '@/utils/scrollLock';

/** Uma sequência assistida em ordem: os Connecs ativos de uma pessoa, um destaque ou o histórico. */
export interface ViewerSequence {
  key: string;
  ownerId: ID;
  /** Título no topo: nome da pessoa ou do destaque. */
  title: string;
  /** Linha de apoio (ex.: dono do destaque). */
  subtitle?: string;
  connecs: Connec[];
}

interface ConnecViewerProps {
  sequences: ViewerSequence[];
  startSequence?: number;
  startIndex?: number;
  /** 'active': tempos curtos do feed ("3min"). 'archive': períodos maiores ("8 semanas"). */
  timeScale: 'active' | 'archive';
  /** Destaque do próprio usuário aberto: permite tirar o Connec dele. */
  highlightId?: ID;
  onClose: () => void;
}

function reducedMotion(): boolean {
  return document.documentElement.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const SIDE_ARROW =
  'hidden size-11 shrink-0 place-items-center rounded-full bg-paper/10 text-paper transition-colors hover:bg-paper/20 disabled:invisible [@media(hover:hover)_and_(pointer:fine)]:grid';

/**
 * Visualizador em tela cheia. Toque à esquerda volta, à direita avança; segurar pausa.
 * Com mouse, setas laterais e teclado (← →, Esc, espaço). Com movimento reduzido, não avança sozinho.
 */
export function ConnecViewer({ sequences, startSequence = 0, startIndex = 0, timeScale, highlightId, onClose }: ConnecViewerProps) {
  const { state, users, markConnecSeen, deleteConnec, setConnecInHighlight } = useApp();
  const { openConnecComposer, openComposer } = useUI();
  const { success, toast } = useToast();
  const navigate = useNavigate();
  const now = useNow(1000);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pressedAt = useRef(0);

  const [pos, setPos] = useState({ seq: startSequence, index: startIndex });
  const [restart, setRestart] = useState(0);
  const [removed, setRemoved] = useState<Set<ID>>(() => new Set());
  const [userPaused, setUserPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [footerActive, setFooterActive] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [privacyFor, setPrivacyFor] = useState<Connec | null>(null);
  const [pickerFor, setPickerFor] = useState<ID | null>(null);
  const [deleting, setDeleting] = useState<Connec | null>(null);
  const [autoplay] = useState(() => !reducedMotion());
  const canCreate = useCanCreateConnec();
  const [muted, setMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // Sempre a versão atual de cada Connec (a privacidade pode mudar com o visualizador aberto)
  const lists = useMemo(() => {
    const live = new Map(state.connecs.map((connec) => [connec.id, connec]));
    return sequences.map((sequence) => sequence.connecs.flatMap((connec) => (removed.has(connec.id) ? [] : (live.get(connec.id) ?? []))));
  }, [sequences, state.connecs, removed]);

  const list = lists[pos.seq] ?? [];
  const index = Math.min(pos.index, list.length - 1);
  const connec = index >= 0 ? list[index] : undefined;
  const sequence = sequences[pos.seq];
  const owner = connec ? users[connec.authorId] : undefined;
  const mine = connec?.authorId === ME;
  const dialogOpen = Boolean(privacyFor || pickerFor || deleting);
  const paused = userPaused || holding || footerActive || hidden || dialogOpen;

  const startOf = useCallback(
    (seq: number) => {
      if (timeScale !== 'active') return 0;
      const unseen = lists[seq].findIndex((entry) => !state.seenConnecIds.includes(entry.id));
      return unseen === -1 ? 0 : unseen;
    },
    [lists, timeScale, state.seenConnecIds],
  );

  const neighbour = useCallback(
    (from: number, step: 1 | -1) => {
      for (let seq = from + step; seq >= 0 && seq < lists.length; seq += step) if (lists[seq].length > 0) return seq;
      return -1;
    },
    [lists],
  );

  const goNext = useCallback(() => {
    if (index < list.length - 1) return setPos({ seq: pos.seq, index: index + 1 });
    const next = neighbour(pos.seq, 1);
    if (next === -1) onClose();
    else setPos({ seq: next, index: startOf(next) });
  }, [index, list.length, pos.seq, neighbour, startOf, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) return setPos({ seq: pos.seq, index: index - 1 });
    const prev = neighbour(pos.seq, -1);
    if (prev === -1) setRestart((value) => value + 1);
    else setPos({ seq: prev, index: lists[prev].length - 1 });
  }, [index, pos.seq, neighbour, lists]);

  // A sequência atual ficou vazia (Connec excluído ou tirado do destaque): segue para a próxima
  useEffect(() => {
    if (connec) return;
    const next = neighbour(pos.seq, 1);
    const prev = neighbour(pos.seq, -1);
    if (next !== -1) setPos({ seq: next, index: 0 });
    else if (prev !== -1) setPos({ seq: prev, index: 0 });
    else onClose();
  }, [connec, neighbour, pos.seq, onClose]);

  useEffect(() => {
    if (connec) markConnecSeen(connec.id);
    setVideoProgress(0);
  }, [connec?.id, markConnecSeen]);

  // Vídeo: toca e pausa junto com o visualizador. Se o navegador não deixar tocar com som, toca sem som.
  const playsVideo = connec?.media?.type === 'video' && Boolean(connec.media.url);
  useEffect(() => {
    const video = videoRef.current;
    if (!playsVideo || !video) return;
    if (paused) {
      video.pause();
      return;
    }
    video.play().catch(() => {
      video.muted = true;
      setMuted(true);
      void video.play().catch(() => undefined);
    });
  }, [playsVideo, paused, connec?.id, restart]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();
    rootRef.current?.focus({ preventScroll: true });
    const onVisibility = () => setHidden(document.visibilityState !== 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      unlock();
      document.removeEventListener('visibilitychange', onVisibility);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (dialogOpen || event.defaultPrevented) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    } else if (event.key === ' ' && event.target === rootRef.current) {
      event.preventDefault();
      setUserPaused((value) => !value);
    }
  };

  /** Toque curto navega; segurar só pausa. */
  const tapZone = (action: () => void) => ({
    onPointerDown: () => {
      pressedAt.current = Date.now();
      setHolding(true);
    },
    onPointerUp: () => setHolding(false),
    onPointerCancel: () => setHolding(false),
    onPointerLeave: () => setHolding(false),
    onClick: () => {
      if (Date.now() - pressedAt.current < 350) action();
    },
  });

  if (!connec || !sequence) return null;

  const age = timeScale === 'active' ? connecAge(connec.createdAt, now) : highlightAge(connec.createdAt, now);
  const hasPrev = index > 0 || neighbour(pos.seq, -1) !== -1;
  const hasNext = index < list.length - 1 || neighbour(pos.seq, 1) !== -1;
  const PrivacyIcon = connec.privacy.audience === 'everyone' ? Globe2 : Lock;

  const dropLocally = (id: ID) => setRemoved((current) => new Set(current).add(id));

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Connecs de ${sequence.title}`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="theme-dark theme-navy fixed inset-0 z-[60] flex animate-fade-in items-center justify-center gap-4 bg-night/90 outline-none backdrop-blur-sm sm:p-6"
    >
      <div className="absolute inset-0 hidden sm:block" onClick={onClose} aria-hidden />

      <button type="button" aria-label="Connec anterior" className={cn(SIDE_ARROW, 'relative')} disabled={!hasPrev} onClick={goPrev}>
        <ChevronLeft className="size-6" aria-hidden />
      </button>

      <div className="relative flex h-[100dvh] w-full shrink-0 flex-col overflow-hidden bg-ink-950 shadow-float sm:aspect-[9/16] sm:h-[min(48rem,calc(100dvh-3rem))] sm:w-auto sm:rounded-[1.5rem] sm:border sm:border-white/10">
        <ConnecFace
          key={`${connec.id}-${restart}`}
          connec={connec}
          fit="auto"
          textSize="lg"
          videoRef={videoRef}
          videoProps={{
            muted,
            onTimeUpdate: (event) => {
              const { currentTime, duration } = event.currentTarget;
              if (duration > 0) setVideoProgress(currentTime / duration);
            },
            // O vídeo dura o que tiver de duração; ao terminar, segue para o próximo (sem avanço automático, para no fim)
            onEnded: () => (autoplay ? goNext() : setVideoProgress(1)),
          }}
        />

        {/* Toque: esquerda volta, direita avança */}
        <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 left-0 w-[32%]" {...tapZone(goPrev)} />
        <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 right-0 w-[68%]" {...tapZone(goNext)} />

        {/* Topo: tempo de cada Connec e quem publicou */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-night/75 to-transparent px-3 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex gap-1" aria-hidden>
            {list.map((entry, i) => (
              <span key={entry.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-paper/30">
                {i === index && playsVideo ? (
                  <span className="block h-full bg-sun" style={{ width: `${videoProgress * 100}%` }} />
                ) : i === index ? (
                  <span
                    key={`${pos.seq}-${index}-${restart}`}
                    className="block h-full origin-left bg-sun"
                    style={
                      autoplay
                        ? { animation: `connec-progress ${CONNEC_SLIDE_MS}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }
                        : undefined
                    }
                    onAnimationEnd={goNext}
                  />
                ) : (
                  <span className={cn('block h-full bg-sun', i < index ? 'w-full' : 'w-0')} />
                )}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            {owner && (
              <Link
                to={`/perfil/${owner.id}`}
                onClick={onClose}
                className="pointer-events-auto shrink-0 rounded-squircle"
                aria-label={`Perfil de ${owner.name}`}
              >
                <Avatar user={owner} size="sm" />
              </Link>
            )}
            <div className="min-w-0 flex-1 text-paper">
              <p className="truncate text-sm font-bold leading-tight">{sequence.title}</p>
              <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-paper/75">
                {sequence.subtitle && <span className="truncate">{sequence.subtitle} ·</span>}
                <time dateTime={connec.createdAt} title={fullDate(connec.createdAt)}>
                  {age}
                </time>
                {mine && (
                  <>
                    <span aria-hidden>·</span>
                    <PrivacyIcon className="size-3 shrink-0" aria-hidden />
                    <span className="truncate">{privacyLabel(connec.privacy)}</span>
                  </>
                )}
              </p>
            </div>
            {playsVideo && (
              <button
                type="button"
                aria-label={muted ? 'Ativar som' : 'Desativar som'}
                className="pointer-events-auto grid size-9 place-items-center rounded-full text-paper transition-colors hover:bg-paper/15"
                onClick={() => setMuted((value) => !value)}
              >
                {muted ? <VolumeX className="size-[1.125rem]" aria-hidden /> : <Volume2 className="size-[1.125rem]" aria-hidden />}
              </button>
            )}
            {(autoplay || playsVideo) && (
              <button
                type="button"
                aria-label={userPaused ? 'Continuar' : 'Pausar'}
                className="pointer-events-auto grid size-9 place-items-center rounded-full text-paper transition-colors hover:bg-paper/15"
                onClick={() => setUserPaused((value) => !value)}
              >
                {userPaused ? <Play className="size-[1.125rem]" aria-hidden /> : <Pause className="size-[1.125rem]" aria-hidden />}
              </button>
            )}
            <button
              type="button"
              aria-label="Fechar"
              className="pointer-events-auto grid size-9 place-items-center rounded-full text-paper transition-colors hover:bg-paper/15"
              onClick={onClose}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Rodapé: legenda e, nos Connecs do próprio usuário, as ações */}
        {(Boolean(connec.media && connec.text) || mine) && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/85 via-night/50 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-14"
            onPointerEnter={() => setFooterActive(true)}
            onPointerLeave={() => setFooterActive(false)}
            onFocusCapture={() => setFooterActive(true)}
            onBlurCapture={() => setFooterActive(false)}
          >
            {connec.media && connec.text && <p className="text-[0.9375rem] font-medium leading-snug text-paper [overflow-wrap:anywhere]">{connec.text}</p>}
            {mine && (
              <div className="pointer-events-auto mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrivacyFor(connec)}
                  className="flex h-9 min-w-0 items-center gap-1.5 rounded-full bg-paper/15 px-3 text-[0.8125rem] font-semibold text-paper transition-colors hover:bg-paper/25"
                >
                  <PrivacyIcon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{privacyLabel(connec.privacy)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPickerFor(connec.id)}
                  className="btn-sun flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[0.8125rem]"
                >
                  <BookmarkPlus className="size-4" aria-hidden />
                  Destaque
                </button>
                <Menu
                  label="Mais opções do Connec"
                  side="top"
                  className="ml-auto"
                  buttonClassName="grid size-9 place-items-center rounded-full bg-paper/15 text-paper transition-colors hover:bg-paper/25"
                  items={[
                    canCreate && {
                      label: 'Publicar de novo',
                      icon: Repeat2,
                      onSelect: () => {
                        onClose();
                        openConnecComposer({
                          media: connec.media,
                          text: connec.text,
                          background: connec.background,
                          fill: connec.fill,
                          privacy: connec.privacy,
                          sourceId: connec.id,
                        });
                      },
                    },
                    connec.media && {
                      label: 'Usar em uma publicação',
                      icon: ImagePlus,
                      onSelect: () => {
                        onClose();
                        openComposer('text', { text: connec.text, media: connec.media ? [{ ...connec.media, id: uid('media') }] : [] });
                      },
                    },
                    {
                      label: 'Ver meu histórico',
                      icon: History,
                      onSelect: () => {
                        onClose();
                        navigate('/arquivo');
                      },
                    },
                    Boolean(highlightId) && {
                      label: 'Remover do destaque',
                      icon: BookmarkX,
                      separated: true,
                      onSelect: () => {
                        if (highlightId) setConnecInHighlight(highlightId, connec.id, false);
                        dropLocally(connec.id);
                        toast('Removido do destaque. O Connec continua no seu histórico.');
                      },
                    },
                    { label: 'Excluir Connec', icon: Trash2, danger: true, separated: !highlightId, onSelect: () => setDeleting(connec) },
                  ]}
                >
                  <MoreHorizontal className="size-5" aria-hidden />
                </Menu>
              </div>
            )}
          </div>
        )}
      </div>

      <button type="button" aria-label="Próximo Connec" className={cn(SIDE_ARROW, 'relative')} disabled={!hasNext} onClick={goNext}>
        <ChevronRight className="size-6" aria-hidden />
      </button>

      {privacyFor && <ConnecPrivacyModal connec={privacyFor} onClose={() => setPrivacyFor(null)} />}
      <HighlightPickerModal connecId={pickerFor} onClose={() => setPickerFor(null)} />
      <ConfirmDialog
        open={deleting !== null}
        title="Excluir este Connec?"
        description="Ele sai do feed, do seu histórico e de todos os destaques. Não dá para desfazer."
        confirmLabel="Excluir Connec"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteConnec(deleting.id);
          dropLocally(deleting.id);
          success('Connec excluído.');
        }}
      />
    </div>,
    document.body,
  );
}
