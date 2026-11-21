import { ImagePlus, Video } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';

/** Convite para publicar no topo do feed. Abre o criador de publicações. */
export function ComposerCard() {
  const { me } = useApp();
  const { openComposer } = useUI();

  return (
    <section className="card p-3.5 sm:p-4" aria-label="Criar publicação">
      <div className="flex items-center gap-3">
        <Avatar user={me} />
        <button
          type="button"
          onClick={() => openComposer('text')}
          className="h-11 min-w-0 flex-1 truncate rounded-full border border-line bg-ink-850 px-4 text-left text-[0.9375rem] text-mist transition-colors hover:border-white/20 hover:bg-ink-700 hover:text-fog"
        >
          No que você está pensando?
        </button>
      </div>
      <div className="mt-3 flex items-center gap-1 border-t border-line pt-3">
        <Button variant="ghost" size="sm" icon={<ImagePlus className="size-[1.125rem] text-brand-300" aria-hidden />} onClick={() => openComposer('image')}>
          Foto
        </Button>
        <Button variant="ghost" size="sm" icon={<Video className="size-[1.125rem] text-brand-300" aria-hidden />} onClick={() => openComposer('video')}>
          Vídeo
        </Button>
        <Button variant="accent" size="sm" className="ml-auto px-4" onClick={() => openComposer('text')}>
          Criar publicação
        </Button>
      </div>
    </section>
  );
}
