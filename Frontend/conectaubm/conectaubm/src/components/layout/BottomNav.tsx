import { NavLink } from 'react-router-dom';
import { Compass, Home, MessageCircle, Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { CountBadge } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { cn } from '@/utils/cn';

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative flex h-full flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-colors',
    isActive ? 'text-white [&_svg]:text-sun' : 'text-mist',
  );

/** Navegação inferior fixa do celular, com os atalhos de uso mais frequente ao alcance do polegar. */
export function BottomNav() {
  const { me, counts } = useApp();
  const { openComposer } = useUI();

  return (
    <nav
      aria-label="Navegação principal"
      className="theme-dark theme-navy navy-surface pb-safe fixed inset-x-0 bottom-0 z-40 rounded-t-[1.5rem] border-t border-white/10 shadow-[0_-10px_30px_-16px_rgba(2,22,55,0.7)] md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch px-2">
        <NavLink to="/" end className={itemClass}>
          {({ isActive }) => (
            <>
              <Home className="size-6" strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />
              Início
            </>
          )}
        </NavLink>
        <NavLink to="/explorar" className={itemClass}>
          {({ isActive }) => (
            <>
              <Compass className="size-6" strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />
              Explorar
            </>
          )}
        </NavLink>
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            aria-label="Criar publicação"
            onClick={() => openComposer()}
            className="btn-sun grid size-12 -translate-y-2 place-items-center rounded-full ring-4 ring-[#041838] transition-transform active:scale-95"
          >
            <Plus className="size-6" strokeWidth={2.4} aria-hidden />
          </button>
        </div>
        <NavLink to="/mensagens" className={itemClass}>
          {({ isActive }) => (
            <>
              <span className="relative">
                <MessageCircle className="size-6" strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />
                <CountBadge count={counts.messages} className="absolute -right-2 -top-1.5 ring-ink-850" />
              </span>
              Mensagens
              {counts.messages > 0 && <span className="sr-only">{counts.messages} não lidas</span>}
            </>
          )}
        </NavLink>
        <NavLink to="/perfil/me" className={itemClass}>
          {({ isActive }) => (
            <>
              <Avatar user={me} size="xs" className={cn('rounded-squircle', isActive && 'ring-2 ring-sun ring-offset-2 ring-offset-[#041838]')} />
              Perfil
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
