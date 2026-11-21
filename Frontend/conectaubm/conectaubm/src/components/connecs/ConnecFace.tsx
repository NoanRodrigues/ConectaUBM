import { useEffect, useRef, useState, type VideoHTMLAttributes, type Ref } from 'react';
import { VideoOff } from 'lucide-react';
import type { Connec } from '@/types';
import { cn } from '@/utils/cn';
import { CONNEC_BACKGROUNDS, mediaFillsFrame } from '@/utils/connecs';

interface ConnecFaceProps {
  /** Conteúdo a mostrar. Sem Connec e sem imagem, fica só o fundo azul-marinho. */
  connec: Pick<Connec, 'media' | 'text' | 'background' | 'fill'> | null;
  /** Imagem que substitui a do Connec (capa personalizada de destaque). */
  imageUrl?: string | null;
  /** Tamanho do texto nos Connecs sem imagem. */
  textSize?: 'xs' | 'sm' | 'lg';
  /**
   * cover: cartões quadrados (recorta para preencher; vídeo mostra a capa).
   * auto: tela cheia. Foto ou vídeo vertical que preenche a tela ocupa tudo; o que não preenche
   * aparece inteiro, sem esticar nem cortar, sobre o fundo escolhido (ou a própria mídia desfocada).
   */
  fit?: 'cover' | 'auto';
  /** Avisa se a mídia preenche a tela (para mostrar ou não a escolha de fundo na criação). */
  onFillsChange?: (fills: boolean) => void;
  /** Só no modo auto, para vídeos: controle de reprodução pelo visualizador. */
  videoRef?: Ref<HTMLVideoElement>;
  videoProps?: VideoHTMLAttributes<HTMLVideoElement>;
  className?: string;
}

const TEXT = {
  // Margem em cima e embaixo para o texto não ficar sob as etiquetas do cartão (tempo, nome, data)
  xs: 'px-2.5 pb-11 pt-7 text-[0.6875rem] leading-snug line-clamp-3',
  sm: 'p-3 text-[0.8125rem] leading-snug line-clamp-5',
  lg: 'px-8 text-[1.375rem] leading-snug sm:text-2xl',
} as const;

/** Face visual de um Connec: foto, vídeo ou texto sobre um dos fundos da identidade. Preenche o contêiner. */
export function ConnecFace({ connec, imageUrl, textSize = 'sm', fit = 'cover', onFillsChange, videoRef, videoProps, className }: ConnecFaceProps) {
  const media = connec?.media ?? null;
  const isVideo = !imageUrl && media?.type === 'video';
  const url = imageUrl ?? media?.url ?? null;
  const still = isVideo ? (media?.poster ?? null) : url;

  const frameRef = useRef<HTMLSpanElement>(null);
  const [frame, setFrame] = useState<number | null>(null);
  // Proporção da mídia, sempre ligada à URL medida (ao trocar de Connec, não vale a medida anterior)
  const [measured, setMeasured] = useState<{ src: string; ratio: number } | null>(null);
  const source = isVideo ? (url ?? '') : (still ?? '');
  const ratio = measured?.src === source ? measured.ratio : null;
  const fills = fit === 'auto' && ratio !== null && frame !== null && mediaFillsFrame(ratio, frame);

  useEffect(() => {
    if (fit !== 'auto') return;
    const el = frameRef.current;
    if (!el) return;
    const update = () => el.clientHeight > 0 && setFrame(el.clientWidth / el.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit]);

  useEffect(() => {
    if (fit === 'auto' && ratio !== null && frame !== null) onFillsChange?.(fills);
  }, [fit, fills, ratio, frame, onFillsChange]);

  const measure = (width: number, height: number) => {
    if (width > 0 && height > 0) setMeasured({ src: source, ratio: width / height });
  };

  if (!url && !still) {
    const background = CONNEC_BACKGROUNDS[connec?.background ?? 'navy'];
    return (
      <span className={cn('absolute inset-0 grid place-items-center overflow-hidden text-center', background.className, className)}>
        {connec?.text && (
          <span className={cn('font-display font-bold [overflow-wrap:anywhere]', background.text, TEXT[textSize])}>{connec.text}</span>
        )}
      </span>
    );
  }

  // Cartões: sempre recortados para o quadrado; vídeo aparece pela capa
  if (fit === 'cover') {
    return (
      <span className={cn('absolute inset-0 overflow-hidden bg-ink-950', className)}>
        {still && <img src={still} alt={imageUrl ? '' : (media?.alt ?? '')} draggable={false} className="size-full object-cover" />}
      </span>
    );
  }

  const fill = connec?.fill ? CONNEC_BACKGROUNDS[connec.fill] : null;
  const mediaClass = cn('relative size-full', fills ? 'object-cover' : 'object-contain');

  return (
    <span ref={frameRef} className={cn('absolute inset-0 overflow-hidden bg-ink-950', className)}>
      {/* Fundo só aparece quando a mídia não preenche a tela */}
      {!fills &&
        (fill ? (
          <span className={cn('absolute inset-0', fill.className)} aria-hidden />
        ) : (
          still && <img src={still} alt="" aria-hidden draggable={false} className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl" />
        ))}

      {isVideo ? (
        url ? (
          <video
            ref={videoRef}
            key={url}
            src={url}
            poster={media?.poster}
            playsInline
            preload="auto"
            aria-label={media?.alt}
            className={mediaClass}
            onLoadedMetadata={(event) => measure(event.currentTarget.videoWidth, event.currentTarget.videoHeight)}
            {...videoProps}
          />
        ) : (
          <>
            {still && (
              <img src={still} alt="" className={cn(mediaClass, 'opacity-40')} onLoad={(event) => measure(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)} />
            )}
            <span className="absolute inset-0 grid place-items-center px-8 text-center text-paper">
              <span className="flex max-w-xs flex-col items-center gap-2">
                <VideoOff className="size-7" aria-hidden />
                <span className="text-sm font-semibold">Vídeo indisponível nesta sessão</span>
                <span className="text-xs leading-relaxed text-paper/75">
                  Este vídeo não está mais disponível neste navegador. Escolha o arquivo de novo.
                </span>
              </span>
            </span>
          </>
        )
      ) : (
        <img
          src={url ?? ''}
          alt={imageUrl ? '' : (media?.alt ?? '')}
          draggable={false}
          className={mediaClass}
          onLoad={(event) => measure(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
        />
      )}
    </span>
  );
}
