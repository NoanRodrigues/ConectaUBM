import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ArrowLeft, Camera, Globe2, Images, Lock, Palette, Smartphone, Type, Volume2, VolumeX, X } from 'lucide-react';
import { AudiencePicker } from '@/components/connecs/AudiencePicker';
import { ConnecFace } from '@/components/connecs/ConnecFace';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { useCanCreateConnec } from '@/hooks/useCanCreateConnec';
import { ServiceError } from '@/services/api';
import { fileToConnecMedia } from '@/services/connecService';
import type { ConnecBackground, ConnecDraft, ConnecPrivacy, Media } from '@/types';
import { cn } from '@/utils/cn';
import { CONNEC_BACKGROUNDS, CONNEC_MOBILE_ONLY, CONNEC_TEXT_MAX, privacyLabel, PUBLIC_PRIVACY } from '@/utils/connecs';
import { lockScroll } from '@/utils/scrollLock';

interface CreateConnecModalProps {
  open: boolean;
  onClose: () => void;
  /** Conteúdo de um Connec antigo, para publicar de novo a partir do histórico. */
  initial?: ConnecDraft | null;
}

type Step = 'choose' | 'compose';

const BACKGROUND_IDS = Object.keys(CONNEC_BACKGROUNDS) as ConnecBackground[];

const ROUND = 'grid size-10 place-items-center rounded-full bg-night/45 text-paper backdrop-blur transition-colors hover:bg-night/65';

/**
 * Criação de Connecs em tela cheia, pensada para celular e tablet.
 * 1. Acessar câmera (traseira, quando o aparelho permite) ou galeria: fotos e vídeos. Ou só texto.
 * 2. Prévia do jeito que vai aparecer, com legenda, quem pode ver e, quando a mídia não preenche a tela, o fundo.
 */
export function CreateConnecModal({ open, onClose, initial }: CreateConnecModalProps) {
  const { createConnec } = useApp();
  const { success, error: toastError } = useToast();
  const canCreate = useCanCreateConnec();

  const [step, setStep] = useState<Step>(initial ? 'compose' : 'choose');
  const [textOnly, setTextOnly] = useState(Boolean(initial && !initial.media));
  const [media, setMedia] = useState<Media | null>(initial?.media ?? null);
  const [text, setText] = useState(initial?.text ?? '');
  const [background, setBackground] = useState<ConnecBackground>(initial?.background ?? 'navy');
  const [fill, setFill] = useState<ConnecBackground | undefined>(initial?.fill);
  const [privacy, setPrivacy] = useState<ConnecPrivacy>(initial?.privacy ?? PUBLIC_PRIVACY);
  const [fills, setFills] = useState<boolean | null>(null);
  const [showFills, setShowFills] = useState(false);
  const [muted, setMuted] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const published = useRef(false);
  const mediaRef = useRef(media);
  mediaRef.current = media;

  const remaining = CONNEC_TEXT_MAX - text.length;
  const dirty = Boolean(media) || text.trim().length > 0;
  const canPublish = (Boolean(media) || text.trim().length > 0) && remaining >= 0 && !processing;
  const isVideo = media?.type === 'video';

  /** Vídeos vivem em object URLs: libera a memória do que não foi publicado. */
  const release = useCallback((item: Media | null) => {
    if (item?.url.startsWith('blob:') && item.url !== initial?.media?.url) URL.revokeObjectURL(item.url);
  }, [initial?.media?.url]);

  useEffect(() => {
    if (!open || !canCreate) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();
    rootRef.current?.focus({ preventScroll: true });
    return () => {
      unlock();
      if (!published.current) release(mediaRef.current);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, canCreate, release]);

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setProblem(null);
    setProcessing(true);
    try {
      const next = await fileToConnecMedia(file);
      release(media);
      setMedia(next);
      setFills(null);
      setFill(undefined);
      setShowFills(false);
      setTextOnly(false);
      setStep('compose');
    } catch (reason) {
      setProblem(reason instanceof Error ? reason.message : 'Não foi possível usar este arquivo.');
    } finally {
      setProcessing(false);
    }
  };

  const backToChoose = () => {
    release(media);
    setMedia(null);
    setTextOnly(false);
    setProblem(null);
    setStep('choose');
  };

  const requestClose = () => {
    if (publishing) return;
    if (dirty && !initial) setConfirmDiscard(true);
    else onClose();
  };

  const publish = async () => {
    if (!canPublish) return;
    setProblem(null);
    setPrivacyError(null);
    setPublishing(true);
    try {
      await createConnec({ media, text, background, fill: media && fills === false ? fill : undefined, privacy, sourceId: initial?.sourceId });
      published.current = true;
      success('Connec publicado. Fica no feed por 24 horas e depois no seu histórico.');
      onClose();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Não foi possível publicar. Tente de novo.';
      if (reason instanceof ServiceError && reason.field === 'privacy') {
        setPrivacyError(message);
        setPrivacyOpen(true);
      } else {
        setProblem(message);
      }
      toastError(message);
      setPublishing(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || privacyOpen || confirmDiscard || event.defaultPrevented) return;
    event.preventDefault();
    requestClose();
  };

  if (!open) return null;

  // Defesa extra: mesmo aberto por outro caminho, o criador não funciona no computador
  if (!canCreate) {
    return (
      <Modal open onClose={onClose} title="Crie Connecs pelo celular" size="sm" footer={<Button onClick={onClose}>Entendi</Button>}>
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 size-5 shrink-0 text-brand-300" aria-hidden />
          <p className="text-[0.9375rem] leading-relaxed text-fog">{CONNEC_MOBILE_ONLY}</p>
        </div>
      </Modal>
    );
  }

  const PrivacyIcon = privacy.audience === 'everyone' ? Globe2 : Lock;
  const textBackground = CONNEC_BACKGROUNDS[background];

  return createPortal(
    <>
      <div
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-label={initial ? 'Publicar Connec de novo' : 'Novo Connec'}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="theme-dark theme-navy fixed inset-0 z-[60] flex animate-fade-in items-center justify-center bg-night/90 outline-none backdrop-blur-sm sm:p-6"
      >
        {/* Arquivos: a câmera pede a traseira (capture="environment"); a galeria aceita fotos e vídeos */}
        <input ref={cameraInput} type="file" accept="image/*,video/*" capture="environment" hidden onChange={onPick} />
        <input ref={galleryInput} type="file" accept="image/*,video/*" hidden onChange={onPick} />

        <div className="relative flex h-[100dvh] w-full shrink-0 flex-col overflow-hidden bg-ink-950 shadow-float sm:aspect-[9/16] sm:h-[min(48rem,calc(100dvh-3rem))] sm:w-auto sm:rounded-[1.5rem] sm:border sm:border-white/10">
          {step === 'choose' ? (
            <div className="navy-surface flex size-full flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-paper">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Novo Connec</h2>
                <button type="button" aria-label="Fechar" className={ROUND} onClick={requestClose}>
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <div className="flex flex-1 flex-col justify-center gap-3">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => cameraInput.current?.click()}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  <span className="btn-sun grid size-12 shrink-0 place-items-center rounded-full">
                    <Camera className="size-6" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-base font-bold">Acessar câmera</span>
                    <span className="block text-sm text-paper/70">Registre o momento agora, em foto ou vídeo</span>
                  </span>
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => galleryInput.current?.click()}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-500 text-paper">
                    <Images className="size-6" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-base font-bold">Acessar galeria</span>
                    <span className="block text-sm text-paper/70">Escolha uma foto ou um vídeo do aparelho</span>
                  </span>
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setTextOnly(true);
                    setStep('compose');
                  }}
                  className="mx-auto mt-2 flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-paper/85 transition-colors hover:bg-white/10"
                >
                  <Type className="size-4" aria-hidden />
                  Criar só com texto
                </button>

                {processing && (
                  <p className="mt-2 flex items-center justify-center gap-2 text-sm text-paper/80" role="status">
                    <Spinner className="size-4" /> Preparando a mídia
                  </p>
                )}
                {problem && (
                  <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-[0.8125rem] text-danger" role="alert">
                    <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
                    {problem}
                  </p>
                )}
              </div>

              <p className="text-center text-xs text-paper/60">Fica visível por 24 horas e depois continua no seu histórico.</p>
            </div>
          ) : (
            <>
              {/* Prévia: exatamente como o Connec vai aparecer em tela cheia */}
              {textOnly ? (
                <span className={cn('absolute inset-0 grid place-items-center', textBackground.className)}>
                  <textarea
                    data-autofocus
                    value={text}
                    rows={5}
                    disabled={publishing}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="O que está acontecendo no campus?"
                    aria-label="Texto do Connec"
                    className={cn(
                      'w-full resize-none bg-transparent px-8 text-center font-display text-[1.375rem] font-bold leading-snug outline-none sm:text-2xl',
                      textBackground.text,
                      background === 'sun' ? 'placeholder:text-night/50' : 'placeholder:text-paper/55',
                    )}
                  />
                </span>
              ) : (
                <ConnecFace
                  key={media?.id}
                  connec={{ media, text, background, fill }}
                  fit="auto"
                  textSize="lg"
                  onFillsChange={setFills}
                  videoProps={{ autoPlay: true, loop: true, muted }}
                />
              )}

              {/* Topo */}
              <div className="absolute inset-x-0 top-0 flex items-start gap-2 bg-gradient-to-b from-night/60 to-transparent px-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <button
                  type="button"
                  aria-label={initial ? 'Fechar' : 'Voltar e escolher outra mídia'}
                  className={ROUND}
                  disabled={publishing}
                  onClick={initial ? requestClose : backToChoose}
                >
                  {initial ? <X className="size-5" aria-hidden /> : <ArrowLeft className="size-5" aria-hidden />}
                </button>

                <div className="ml-auto flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    {isVideo && media?.url && (
                      <button type="button" aria-label={muted ? 'Ouvir o som do vídeo' : 'Tirar o som do vídeo'} className={ROUND} onClick={() => setMuted((value) => !value)}>
                        {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
                      </button>
                    )}
                    {/* Fundo: só quando faz sentido (texto, ou mídia que não preenche a tela) */}
                    {!textOnly && fills === false && (
                      <button
                        type="button"
                        aria-label="Personalizar o fundo"
                        aria-expanded={showFills}
                        className={cn(ROUND, showFills && 'ring-2 ring-sun')}
                        onClick={() => setShowFills((value) => !value)}
                      >
                        <Palette className="size-5" aria-hidden />
                      </button>
                    )}
                  </div>

                  {(textOnly || (fills === false && showFills)) && (
                    <div
                      className="flex animate-fade-in items-center gap-1.5 rounded-full bg-night/45 p-1.5 backdrop-blur"
                      role="radiogroup"
                      aria-label={textOnly ? 'Fundo do Connec' : 'Fundo atrás da mídia'}
                    >
                      {!textOnly && (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={!fill}
                          aria-label="Automático"
                          title="Automático"
                          onClick={() => setFill(undefined)}
                          className={cn(
                            'grid h-7 place-items-center rounded-full px-2.5 text-[0.6875rem] font-bold text-paper transition-colors',
                            !fill ? 'bg-paper/25 ring-2 ring-sun' : 'bg-paper/10 hover:bg-paper/20',
                          )}
                        >
                          Auto
                        </button>
                      )}
                      {BACKGROUND_IDS.map((id) => {
                        const active = textOnly ? background === id : fill === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={CONNEC_BACKGROUNDS[id].label}
                            title={CONNEC_BACKGROUNDS[id].label}
                            onClick={() => (textOnly ? setBackground(id) : setFill(id))}
                            className={cn(
                              'size-7 rounded-full border-2 border-paper/70 transition-transform',
                              CONNEC_BACKGROUNDS[id].className,
                              active ? 'scale-110 ring-2 ring-sun' : 'hover:scale-105',
                            )}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé: legenda, quem pode ver e publicar */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/85 via-night/55 to-transparent px-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-12">
                {!textOnly && (
                  <div className="relative mb-2.5">
                    <textarea
                      value={text}
                      rows={1}
                      disabled={publishing}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="Escreva uma legenda (opcional)"
                      aria-label="Legenda"
                      className="block max-h-28 min-h-11 w-full resize-none rounded-2xl border border-white/15 bg-night/45 py-2.5 pl-3.5 pr-14 text-[0.9375rem] text-paper outline-none backdrop-blur placeholder:text-paper/60 focus:border-brand-300"
                    />
                    <span className={cn('absolute bottom-2.5 right-3 text-[0.6875rem] font-semibold tabular-nums', remaining < 0 ? 'text-danger' : 'text-paper/60')}>
                      {text.length}/{CONNEC_TEXT_MAX}
                    </span>
                  </div>
                )}
                {textOnly && (
                  <p className={cn('mb-2 text-right text-[0.6875rem] font-semibold tabular-nums', remaining < 0 ? 'text-danger' : 'text-paper/70')}>
                    {text.length}/{CONNEC_TEXT_MAX}
                  </p>
                )}

                {problem && (
                  <p className="mb-2 flex items-start gap-1.5 text-[0.8125rem] text-danger" role="alert">
                    <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
                    {problem}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={publishing}
                    onClick={() => setPrivacyOpen(true)}
                    className="flex h-11 min-w-0 items-center gap-2 rounded-full bg-paper/15 px-4 text-sm font-semibold text-paper backdrop-blur transition-colors hover:bg-paper/25"
                  >
                    <PrivacyIcon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{privacyLabel(privacy)}</span>
                  </button>
                  <Button variant="accent" size="lg" className="ml-auto h-11 rounded-full px-6" onClick={publish} loading={publishing} disabled={!canPublish}>
                    {publishing ? 'Publicando' : 'Publicar'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title="Quem pode ver este Connec"
        description="A escolha vale só para este Connec."
        size="lg"
        footer={<Button onClick={() => setPrivacyOpen(false)}>Pronto</Button>}
      >
        <AudiencePicker
          value={privacy}
          error={privacyError}
          onChange={(next) => {
            setPrivacy(next);
            setPrivacyError(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        title="Descartar Connec?"
        description="A mídia e o texto que você adicionou serão perdidos."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        danger
        onClose={() => setConfirmDiscard(false)}
        onConfirm={onClose}
      />
    </>,
    document.body,
  );
}
