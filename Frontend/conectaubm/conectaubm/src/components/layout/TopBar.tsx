import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, Bell, LogOut, MessageCircle, Search, Settings, User, UserPlus, Users } from 'lucide-react';
import { SearchBox } from '@/components/navigation/SearchBox';
import { Avatar } from '@/components/ui/Avatar';
import { CountBadge } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Logo } from '@/components/ui/Logo';
import { Menu } from '@/components/ui/Menu';
import { Tooltip } from '@/components/ui/Tooltip';
import { useApp } from '@/context/AppContext';

function BarLink({ to, label, count, children }: { to: string; label: string; count: number; children: ReactNode }) {
  return (
    <Tooltip label={label}>
      <Link
        to={to}
        aria-label={count > 0 ? `${label} (${count} novas)` : label}
        className="relative grid size-10 place-items-center rounded-xl text-fog transition-colors hover:bg-white/[0.08] hover:text-white"
      >
        {children}
        <CountBadge count={count} className="absolute -right-0.5 -top-0.5" />
      </Link>
    </Tooltip>
  );
}

/** Barra superior: logo e atalhos no celular; pesquisa e atalhos no desktop. */
export function TopBar() {
  const { me, counts, logout } = useApp();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <header className="theme-dark theme-navy navy-bar shadow-[0_10px_30px_-18px_rgba(2,22,55,0.7)]">
      <div className="mx-auto flex h-16 w-full max-w-[72rem] items-center gap-3 px-4 sm:px-5 lg:px-8">
        <Link to="/" className="rounded-xl md:hidden" aria-label="ConectaUBM, ir para o início">
          <Logo markClassName="size-8" textClassName="text-[1.15rem]" />
        </Link>

        <SearchBox className="hidden max-w-xl flex-1 md:block" />

        <div className="ml-auto flex items-center gap-1">
          <span className="inline-flex md:hidden">
            <BarLink to="/pesquisa" label="Pesquisar" count={0}>
              <Search className="size-[1.375rem]" aria-hidden />
            </BarLink>
          </span>
          <BarLink to="/amigos?aba=recebidas" label="Solicitações de amizade" count={counts.friendRequests}>
            <UserPlus className="size-[1.375rem]" aria-hidden />
          </BarLink>
          <BarLink to="/notificacoes" label="Notificações" count={counts.notifications}>
            <Bell className="size-[1.375rem]" aria-hidden />
          </BarLink>
          <span className="hidden md:inline-flex">
            <BarLink to="/mensagens" label="Mensagens" count={counts.messages}>
              <MessageCircle className="size-[1.375rem]" aria-hidden />
            </BarLink>
          </span>
          <Menu
            label="Menu da conta"
            className="ml-1.5"
            buttonClassName="block rounded-squircle transition-transform hover:scale-105"
            header={
              <div className="mb-1.5 border-b border-white/10 px-3 pb-2.5 pt-2">
                <p className="truncate text-sm font-bold text-white">{me.name}</p>
                <p className="truncate text-xs text-mist">{me.email}</p>
              </div>
            }
            items={[
              { label: 'Meu perfil', icon: User, onSelect: () => navigate('/perfil/me') },
              { label: 'Amigos', icon: Users, onSelect: () => navigate('/amigos') },
              { label: 'Arquivo', icon: Archive, onSelect: () => navigate('/arquivo') },
              { label: 'Configurações', icon: Settings, onSelect: () => navigate('/configuracoes') },
              { label: 'Sair', icon: LogOut, danger: true, separated: true, onSelect: () => setConfirmLogout(true) },
            ]}
          >
            <Avatar user={me} size="sm" className="size-9" />
          </Menu>
        </div>
      </div>

      {/* Filete amarelo que acompanha a barra em todos os tamanhos de tela */}
      <div className="h-[3px] bg-gradient-to-r from-sun via-[#ffc533] to-sun/0" aria-hidden />

      <ConfirmDialog
        open={confirmLogout}
        title="Sair do ConectaUBM?"
        description="Você precisará entrar de novo para ver o feed e as mensagens. Seus dados continuam salvos neste dispositivo."
        confirmLabel="Sair"
        onClose={() => setConfirmLogout(false)}
        onConfirm={logout}
      />
    </header>
  );
}
