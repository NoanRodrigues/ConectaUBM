import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Play, VideoOff, X } from 'lucide-react';
import type { Media } from '@/types';
import { cn } from '@/utils/cn';
import { lockScroll } from '@/utils/scrollLock';

interface VideoPlayerProps {
  media: Media;
  className?: string;
}

/** Player com capa e botão de reproduzir; os controles nativos aparecem depois do primeiro play. */
export function VideoPlayer({ media, className }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!media.url || failed) {
    return (
      <div className={cn('relative grid aspect-video place-items-center overflow-hidden theme-dark bg-ink-950', className)}>
        {media.poster && <img src={media.poster} alt="" className="absolute inset-0 size-full object-cover opacity-35" />}
        <div className="relative flex max-w-xs flex-col items-center gap-2 px-6 text-center">
          <VideoOff className="size-7 text-fog" aria-hidden />
          <p className="text-sm font-semibold text-white">Vídeo indisponível nesta sessão</p>
          <p className="text-xs leading-relaxed text-fog">
            Este vídeo não está mais disponível neste navegador. Escolha o arquivo de novo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative theme-dark bg-ink-950', className)}>
      <video
        ref={ref}
        src={media.url}
        poster={media.poster}
        controls={started}
        playsInline
        preload="metadata"
        aria-label={media.alt}
        className="aspect-video max-h-[32rem] w-full theme-dark bg-ink-950 object-contain"
        onError={() => setFailed(true)}
        onPlay={() => setStarted(true)}
      />
      {!started && (
        <button
          type="button"
          aria-label="Reproduzir vídeo"
          className="group absolute inset-0 grid place-items-center bg-gradient-to-t from-ink-950/60 to-transparent"
          onClick={() => {
            setStarted(true);
            void ref.current?.play().catch(() => undefined);
          }}
        >
          <span className="grid size-16 place-items-center rounded-full bg-white/95 text-brand shadow-float transition-transform duration-200 group-hover:scale-110">
            <Play className="ml-1 size-7 fill-current" aria-hidden />
          </span>
        </button>
      )}
    </div>
  );
}

interface LightboxProps {
  images: Media[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

function Lightbox({ images, index, onIndexChange, onClose }: LightboxProps) {
  const total = images.length;
  useEffect(() => {
    const unlockScroll = lockScroll();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onIndexChange((index + 1) % total);
      if (event.key === 'ArrowLeft') onIndexChange((index - 1 + total) % total);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockScroll();
    };
  }, [index, total, onClose, onIndexChange]);

  const current = images[index];
  return createPortal(
    <div className="fixed inset-0 z-[70] flex animate-fade-in items-center justify-center theme-dark bg-ink-950/95 p-4" role="dialog" aria-modal="true" aria-label="Imagem ampliada">
      <button type="button" className="absolute inset-0 cursor-zoom-out" aria-label="Fechar imagem" onClick={onClose} />
      <img src={current.url} alt={current.alt} className="relative max-h-full max-w-full animate-pop-in rounded-2xl object-contain shadow-float" />
      <button
        type="button"
        aria-label="Fechar"
        autoFocus
        className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        onClick={onClose}
      >
        <X className="size-5" aria-hidden />
      </button>
      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Imagem anterior"
            className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => onIndexChange((index - 1 + total) % total)}
          >
            <ChevronLeft className="size-6" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Próxima imagem"
            className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => onIndexChange((index + 1) % total)}
          >
            <ChevronRight className="size-6" aria-hidden />
          </button>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            {index + 1} de {total}
          </span>
        </>
      )}
    </div>,
    document.body,
  );
}

interface PostMediaProps {
  media: Media[];
  /** Na prévia de criação as imagens não abrem em tela cheia. */
  interactive?: boolean;
}

/** Grade de mídia de uma publicação: 1 a 4 imagens ou um vídeo. */
export function PostMedia({ media, interactive = true }: PostMediaProps) {
  const [zoomed, setZoomed] = useState<number | null>(null);
  if (media.length === 0) return null;

  const video = media.find((item) => item.type === 'video');
  if (video) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line">
        <VideoPlayer media={video} />
      </div>
    );
  }

  const images = media.slice(0, 4);
  const count = images.length;

  return (
    <>
      <div
        className={cn(
          'grid gap-1 overflow-hidden rounded-2xl border border-line theme-dark bg-ink-950',
          count === 1 && 'grid-cols-1',
          count >= 2 && 'aspect-[16/10] grid-cols-2',
          count >= 3 && 'grid-rows-2',
        )}
      >
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            disabled={!interactive}
            aria-label={`Ampliar imagem: ${image.alt}`}
            className={cn(
              'group relative min-h-0 overflow-hidden disabled:cursor-default',
              interactive && 'cursor-zoom-in',
              count === 3 && index === 0 && 'row-span-2',
            )}
            onClick={() => setZoomed(index)}
          >
            <img
              src={image.url}
              alt={image.alt}
              loading="lazy"
              className={cn(
                'w-full object-cover transition-transform duration-500 group-enabled:group-hover:scale-[1.025]',
                count === 1 ? 'max-h-[34rem]' : 'h-full',
              )}
            />
          </button>
        ))}
      </div>
      {zoomed !== null && <Lightbox images={images} index={zoomed} onIndexChange={setZoomed} onClose={() => setZoomed(null)} />}
    </>
  );
}
