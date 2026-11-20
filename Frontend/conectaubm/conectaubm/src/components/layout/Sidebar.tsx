import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronsUpDown, LogOut, Plus, Settings } from 'lucide-react';
import { NAV_ITEMS } from '@/components/navigation/navItems';
import { AcademicLine } from '@/components/ui/Academic';
import { Avatar } from '@/components/ui/Avatar';
import { CountBadge } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Logo } from '@/components/ui/Logo';
import { Menu } from '@/components/ui/Menu';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/utils/cn';

/**
 * Fundo da barra lateral: azul-marinho em degradê, canto inferior direito arredondado
 * (o de cima fica reto para encostar na barra superior, sem fresta)
 * e a faixa diagonal amarela no rodapé. Fica em uma camada própria para não
 * cortar os rótulos flutuantes nem o menu da conta.
 */
function SidebarBackdrop() {
  return (
    <div
      aria-hidden
      className="navy-surface pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-br-[1.75rem] border-r border-white/10 shadow-[10px_0_34px_-16px_rgba(2,22,55,0.55)]"
    >
      <div className="absolute -left-10 -top-16 size-56 rounded-full bg-[#1c5390]/35 blur-3xl" />
      <svg className="absolute inset-x-0 bottom-0 h-48 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sidebar-sun" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="#ffb000" />
            <stop offset="1" stopColor="#d98a00" />
          </linearGradient>
          <filter id="sidebar-sun-glow" x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>
        <polygon points="0,66 100,6 100,100 0,100" fill="#ffb000" opacity="0.5" filter="url(#sidebar-sun-glow)" />
        <polygon points="0,66 100,6 100,100 0,100" fill="url(#sidebar-sun)" />
        <polygon points="0,66 100,6 100,13 0,73" fill="#ffd166" opacity="0.55" />
      </svg>
    </div>
  );
}

/**
 * Navegação lateral (a partir de 768px). Pode ficar expandida, com os rótulos, ou recolhida
 * em ícones; a alça amarela na borda alterna entre os dois estados (ver hooks/useSidebar.ts).
 * Sem escolha do usuário, fica recolhida entre 768 e 1279px e expandida a partir de 1280px.
 */
export function Sidebar() {
  const { me, counts, logout } = useApp();
  const { openComposer } = useUI();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { expanded, toggle } = useSidebar();

  return (
    <aside
      data-sidebar={expanded ? 'expanded' : 'collapsed'}
      className="theme-dark theme-navy fixed inset-y-0 left-0 z-40 hidden w-[4.75rem] flex-col px-3 py-4 transition-[width] duration-200 ease-out md:flex sb:w-64 sb:px-4"
    >
      <SidebarBackdrop />

      {/* Alça sempre visível na borda: recolhe para ícones ou expande com os rótulos */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={expanded ? 'Recolher menu lateral' : 'Expandir menu lateral'}
        title={expanded ? 'Recolher menu' : 'Expandir menu'}
        className="btn-sun absolute -right-3.5 top-[4.5rem] z-10 grid size-7 place-items-center rounded-full ring-[3px] ring-[#041838] transition-transform duration-150 hover:scale-110 active:scale-95"
      >
        {expanded ? <ChevronLeft className="size-4" strokeWidth={2.75} aria-hidden /> : <ChevronRight className="size-4" strokeWidth={2.75} aria-hidden />}
      </button>
      <Link to="/" className="mb-11 flex h-10 items-center justify-center rounded-xl sb:justify-start sb:px-2" aria-label="ConectaUBM, ir para o início">
        <Logo textClassName="hidden sb:inline" />
      </Link>

      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const count = item.badge ? counts[item.badge] : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group/nav relative flex h-11 items-center justify-center gap-3.5 rounded-xl text-[0.9375rem] font-semibold transition-colors duration-150 sb:justify-start sb:px-3.5',
                  isActive
                    ? 'border border-sun/40 bg-sun/20 font-bold text-white shadow-[0_0_26px_-8px_rgba(255,176,0,0.7)] [&_svg]:text-sun'
                    : 'border border-transparent text-fog hover:bg-white/[0.07] hover:text-white',
                )
              }
            >
              <span className="relative">
                <item.icon className="size-[1.375rem]" strokeWidth={1.9} aria-hidden />
                {count > 0 && <CountBadge count={count} className="absolute -right-2 -top-2 ring-ink-850 sb:hidden" />}
              </span>
              <span className="hidden sb:inline">{item.label}</span>
              {count > 0 && <CountBadge count={count} className="ml-auto hidden ring-0 sb:grid" />}
              {count > 0 && <span className="sr-only">{count} novas</span>}
              {/* Rótulo flutuante enquanto a barra está recolhida */}
              <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-ink opacity-0 shadow-float transition-opacity group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100 md:block sb:hidden">
                {item.label}
              </span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => openComposer()}
          className="btn-sun mt-5 flex h-11 items-center justify-center gap-2 rounded-full text-[0.9375rem] transition-all duration-150 active:scale-[0.98]"
          aria-label="Criar publicação"
        >
          <Plus className="size-5 sb:-ml-1" aria-hidden />
          <span className="hidden sb:inline">Criar publicação</span>
        </button>
      </nav>

      <Menu
        label="Sua conta"
        side="top"
        align="left"
        buttonClassName="flex w-full items-center justify-center gap-3 rounded-2xl p-1.5 text-left transition-colors hover:bg-white/[0.06] sb:justify-start sb:border sb:border-white/10 sb:bg-[#04132c]/85 sb:p-2.5 sb:backdrop-blur-md sb:hover:bg-[#0a2147]/90"
        items={[
          { label: 'Configurações', icon: Settings, onSelect: () => navigate('/configuracoes') },
          { label: 'Sair', icon: LogOut, danger: true, separated: true, onSelect: () => setConfirmLogout(true) },
        ]}
      >
        <Avatar user={me} showStatus />
        <span className="hidden min-w-0 flex-1 sb:block">
          <span className="block truncate text-sm font-bold leading-tight text-white">{me.name}</span>
          <AcademicLine user={me} compact className="mt-0.5 text-xs" />
        </span>
        <ChevronsUpDown className="hidden size-4 shrink-0 text-mist sb:block" aria-hidden />
      </Menu>

      <ConfirmDialog
        open={confirmLogout}
        title="Sair do ConectaUBM?"
        description="Você precisará entrar de novo para ver o feed e as mensagens. Seus dados continuam salvos neste dispositivo."
        confirmLabel="Sair"
        onClose={() => setConfirmLogout(false)}
        onConfirm={logout}
      />
    </aside>
  );
}
