import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { UserRound, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { ID } from '@/types';
import { avatarOf } from '@/utils/avatar';
import { cn } from '@/utils/cn';
import { lockScroll } from '@/utils/scrollLock';
import { usernameOf } from '@/utils/users';

const DURATION = 200;

/**
 * Foto de perfil ampliada: quadrada com cantos arredondados, centralizada sobre fundo escurecido.
 * A imagem aparece inteira (sem esticar nem cortar). Fecha no X, com Esc ou clicando fora.
 * "Ver perfil" leva ao perfil, para que ampliar a foto e abrir o perfil convivam sem conflito.
 */
export function AvatarLightbox({ userId, onClose }: { userId: ID; onClose: () => void }) {
  const { users } = useApp();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const closing = useRef(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const user = users[userId];

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setVisible(false);
    window.setTimeout(onClose, DURATION);
  };

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();
    const frame = requestAnimationFrame(() => setVisible(true));
    closeButton.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      cancelAnimationFrame(frame);
      unlock();
      document.removeEventListener('keydown', onKeyDown, true);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;
  const onProfile = location.pathname === `/perfil/${user.id}`;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Foto de perfil de ${user.name}`} className="theme-dark fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 sm:p-8">
      <div
        className={cn('absolute inset-0 bg-night/85 backdrop-blur-sm transition-opacity ease-out', visible ? 'opacity-100' : 'opacity-0')}
        style={{ transitionDuration: `${DURATION}ms` }}
        onClick={close}
        aria-hidden
      />
      <button
        ref={closeButton}
        type="button"
        aria-label="Fechar"
        onClick={close}
        className={cn(
          'absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-paper/10 text-paper transition-[background-color,opacity] hover:bg-paper/20 sm:right-6 sm:top-6',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transitionDuration: `${DURATION}ms` }}
      >
        <X className="size-6" aria-hidden />
      </button>

      <figure
        className={cn(
          'relative flex w-full max-w-[min(30rem,68dvh)] flex-col items-center transition-[opacity,transform] ease-out',
          visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
        )}
        style={{ transitionDuration: `${DURATION}ms` }}
      >
        <img
          src={avatarOf(user)}
          alt={`Foto de perfil de ${user.name}`}
          draggable={false}
          className="aspect-square w-full rounded-[2rem] bg-sky object-contain shadow-float"
        />
        <figcaption className="mt-4 text-center text-paper">
          <span className="block text-lg font-bold leading-tight">{user.name}</span>
          <span className="block text-sm text-paper/70">@{usernameOf(user)}</span>
        </figcaption>
        {!onProfile && (
          <Link
            to={`/perfil/${user.id}`}
            onClick={onClose}
            className="btn-sun mt-4 flex h-10 items-center gap-2 rounded-full px-5 text-sm"
          >
            <UserRound className="size-4" aria-hidden />
            Ver perfil
          </Link>
        )}
      </figure>
    </div>,
    document.body,
  );
}
