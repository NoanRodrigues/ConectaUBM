import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, ImagePlus, PencilLine, Upload, Video, X } from 'lucide-react';
import { MentionSuggestions } from '@/components/mentions/MentionSuggestions';
import { PostCard } from '@/components/posts/PostCard';
import { QuotedPost } from '@/components/posts/QuotedPost';
import { AcademicLine } from '@/components/ui/Academic';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { ME, useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import type { ComposerStart } from '@/context/UIContext';
import { useMentionInput } from '@/hooks/useMentionInput';
import { imageFileToMedia, MAX_IMAGES, videoFileToMedia } from '@/services/mediaService';
import { POST_MAX_LENGTH } from '@/services/postService';
import type { Media, Post, PostDraft } from '@/types';
import { cn } from '@/utils/cn';

interface CreatePostModalProps {
  open: boolean;
  start: ComposerStart;
  /** Texto e mídia iniciais (ex.: imagem reaproveitada de um Connec do histórico). */
  initial?: PostDraft;
  onClose: () => void;
}

/**
 * Criação de publicações: texto (com @ para marcar), até 4 imagens ou 1 vídeo, prévia e publicação na API.
 * Com `initial.quotedPostId`, é um repost com comentário: a original aparece embutida abaixo do texto.
 */
export function CreatePostModal({ open, start, initial, onClose }: CreatePostModalProps) {
  const { me, createPost } = useApp();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [text, setText] = useState(initial?.text ?? '');
  const [media, setMedia] = useState<Media[]>(initial?.media ?? []);
  const [view, setView] = useState<'write' | 'preview'>('write');
  const [processing, setProcessing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const quotedPostId = initial?.quotedPostId;
  const mention = useMentionInput({ value: text, setValue: setText, inputRef: textarea });

  const hasVideo = media.some((item) => item.type === 'video');
  const imageCount = media.filter((item) => item.type === 'image').length;
  const remaining = POST_MAX_LENGTH - text.length;
  const canPublish = (text.trim().length > 0 || media.length > 0) && remaining >= 0 && !processing;
  const dirty = text.trim().length > 0 || media.length > 0;

  // Atalhos "Foto" e "Vídeo" do feed já abrem o seletor de arquivos.
  useEffect(() => {
    if (!open) return;
    if (start === 'image') imageInput.current?.click();
    if (start === 'video') videoInput.current?.click();
  }, [open, start]);

  // Altura do campo acompanha o texto.
  useEffect(() => {
    const element = textarea.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 280)}px`;
  }, [text, view, open]);

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setProblem(null);
    const videos = files.filter((file) => file.type.startsWith('video/'));
    const images = files.filter((file) => file.type.startsWith('image/'));

    if (videos.length + images.length === 0) {
      setProblem('Formato não aceito. Envie imagens (JPG, PNG, WebP) ou um vídeo (MP4, WebM, MOV).');
      return;
    }
    if (videos.length > 0 && (images.length > 0 || imageCount > 0)) {
      setProblem('Uma publicação leva imagens ou um vídeo, não os dois. Remova as imagens para enviar o vídeo.');
      return;
    }
    if (images.length > 0 && hasVideo) {
      setProblem('Esta publicação já tem um vídeo. Remova o vídeo para adicionar imagens.');
      return;
    }
    if (videos.length > 1 || (videos.length === 1 && hasVideo)) {
      setProblem('Cada publicação aceita um vídeo.');
      return;
    }

    setProcessing(true);
    try {
      if (videos.length === 1) {
        const item = await videoFileToMedia(videos[0]);
        setMedia([item]);
      } else {
        const room = MAX_IMAGES - imageCount;
        if (images.length > room) setProblem(`Cada publicação aceita até ${MAX_IMAGES} imagens. As demais ficaram de fora.`);
        const items = await Promise.all(images.slice(0, room).map(imageFileToMedia));
        setMedia((current) => [...current, ...items]);
      }
    } catch (reason) {
      setProblem(reason instanceof Error ? reason.message : 'Não foi possível processar o arquivo.');
    } finally {
      setProcessing(false);
    }
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    void addFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void addFiles(Array.from(event.dataTransfer.files));
  };

  const removeMedia = (item: Media) => {
    if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
    setMedia((current) => current.filter((entry) => entry.id !== item.id));
    setProblem(null);
  };

  const requestClose = () => {
    if (publishing) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const publish = async () => {
    if (!canPublish) return;
    setPublishing(true);
    setProblem(null);
    try {
      const post = await createPost({ text: mention.serialize(), media, quotedPostId });
      success(quotedPostId ? 'Repostado com o seu comentário.' : 'Publicado no feed.', {
        action: { label: 'Ver', onClick: () => navigate(`/post/${post.id}`) },
      });
      onClose();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Não foi possível publicar. Tente de novo.';
      setProblem(message);
      toastError(message);
      setPublishing(false);
    }
  };

  const previewPost: Post = {
    id: 'preview',
    authorId: ME,
    text: mention.serialize(text.trim()),
    media,
    ...(quotedPostId ? { quotedPostId } : {}),
    createdAt: new Date().toISOString(),
    likes: 0,
    likedByMe: false,
    shares: 0,
    reposts: 0,
    repostedByMe: false,
  };

  const circumference = 2 * Math.PI * 9;
  const progress = Math.min(1, text.length / POST_MAX_LENGTH);

  return (
    <>
      <Modal
        open={open}
        onClose={requestClose}
        title={quotedPostId ? 'Repostar com comentário' : 'Criar publicação'}
        size="lg"
        dismissible={!publishing}
        footer={
          <>
            <div className="mr-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                icon={<ImagePlus className="size-[1.125rem]" aria-hidden />}
                disabled={publishing || hasVideo || imageCount >= MAX_IMAGES}
                onClick={() => imageInput.current?.click()}
              >
                Foto
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Video className="size-[1.125rem]" aria-hidden />}
                disabled={publishing || media.length > 0}
                onClick={() => videoInput.current?.click()}
              >
                Vídeo
              </Button>
            </div>
            <Button variant="ghost" onClick={requestClose} disabled={publishing}>
              Cancelar
            </Button>
            <Button variant="accent" onClick={publish} loading={publishing} disabled={!canPublish}>
              {publishing ? 'Publicando' : 'Publicar'}
            </Button>
          </>
        }
      >
        <input ref={imageInput} type="file" accept="image/*" multiple hidden onChange={onPick} />
        <input ref={videoInput} type="file" accept="video/*" hidden onChange={onPick} />

        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar user={me} />
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] font-bold text-white">{me.name}</p>
              <AcademicLine user={me} />
            </div>
          </div>
          <div className="flex shrink-0 rounded-xl bg-ink-850 p-1" role="tablist" aria-label="Modo de edição">
            {(
              [
                ['write', 'Escrever', PencilLine],
                ['preview', 'Prévia', Eye],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                disabled={id === 'preview' && !dirty}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-lg px-3 text-[0.8125rem] font-semibold transition-colors disabled:opacity-40',
                  view === id ? 'bg-ink-600 text-white' : 'text-mist hover:text-white',
                )}
                onClick={() => setView(id)}
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        {view === 'preview' ? (
          <div className="animate-fade-in">
            <p className="mb-2.5 text-[0.8125rem] text-mist">É assim que a publicação vai aparecer no feed.</p>
            <PostCard post={previewPost} preview />
          </div>
        ) : (
          <div
            className={cn('rounded-2xl transition-shadow', dragging && 'shadow-[0_0_0_2px_#4ea3e8]')}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="relative">
              <textarea
                ref={textarea}
                data-autofocus
                value={text}
                rows={3}
                {...mention.inputProps}
                onKeyDown={mention.onKeyDown}
                placeholder={quotedPostId ? 'Adicione um comentário' : 'No que você está pensando?'}
                aria-label={quotedPostId ? 'Seu comentário sobre a publicação' : 'Texto da publicação'}
                disabled={publishing}
                className="block min-h-[5.5rem] w-full resize-none bg-transparent text-[1.0625rem] leading-relaxed text-white outline-none placeholder:text-mist"
              />
              <MentionSuggestions list={mention.list} />
            </div>

            {quotedPostId && <QuotedPost postId={quotedPostId} interactive={false} className="mt-1" />}

            {media.length > 0 && (
              <ul className={cn('mt-3 grid gap-2', hasVideo ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-4')}>
                {media.map((item) => (
                  <li key={item.id} className="group relative animate-pop-in overflow-hidden rounded-xl border border-line bg-ink-950">
                    {item.type === 'video' ? (
                      <video src={item.url} poster={item.poster} controls playsInline className="aspect-video w-full object-contain" />
                    ) : (
                      <img src={item.url} alt={item.alt} className="aspect-square w-full object-cover" />
                    )}
                    <button
                      type="button"
                      aria-label={item.type === 'video' ? 'Remover vídeo' : 'Remover imagem'}
                      disabled={publishing}
                      className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-night/80 text-paper backdrop-blur transition-colors hover:bg-danger"
                      onClick={() => removeMedia(item)}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {processing && (
              <p className="mt-3 flex items-center gap-2 text-sm text-fog" role="status">
                <Spinner className="size-4" /> Preparando a mídia
              </p>
            )}

            {media.length === 0 && !processing && !quotedPostId && (
              <button
                type="button"
                disabled={publishing}
                onClick={() => imageInput.current?.click()}
                className={cn(
                  'mt-3 flex w-full flex-col items-center gap-1.5 rounded-2xl border border-dashed px-4 py-7 text-center transition-colors',
                  dragging ? 'border-brand-300 bg-brand/20' : 'border-white/15 bg-white/[0.02] hover:border-brand-400 hover:bg-brand/10',
                )}
              >
                <Upload className="size-6 text-brand-300" aria-hidden />
                <span className="text-sm font-semibold text-white">Arraste fotos ou um vídeo para cá</span>
                <span className="text-[0.8125rem] text-mist">ou toque para escolher do dispositivo. Até {MAX_IMAGES} imagens ou 1 vídeo.</span>
              </button>
            )}
          </div>
        )}

        <div className="mt-3 flex min-h-6 items-center justify-between gap-3">
          {problem ? (
            <p className="flex items-start gap-1.5 text-[0.8125rem] text-danger" role="alert">
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden />
              {problem}
            </p>
          ) : (
            <span />
          )}
          <span
            className={cn(
              'flex shrink-0 items-center gap-2 text-xs font-semibold tabular-nums',
              remaining < 0 ? 'text-danger' : remaining <= 40 ? 'text-warn' : 'text-mist',
            )}
            aria-live="polite"
          >
            {text.length}/{POST_MAX_LENGTH}
            <svg viewBox="0 0 24 24" className="size-5 -rotate-90" aria-hidden>
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                className="transition-[stroke-dashoffset] duration-200"
              />
            </svg>
          </span>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        title="Descartar publicação?"
        description="O texto e as mídias que você adicionou serão perdidos."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        danger
        onClose={() => setConfirmDiscard(false)}
        onConfirm={onClose}
      />
    </>
  );
}
