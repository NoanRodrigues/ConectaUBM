import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useMatch } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { UIProvider } from '@/context/UIContext';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/utils/cn';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/** Estrutura das páginas autenticadas: sidebar (desktop/tablet), barra superior e navegação inferior (celular). */
export function AppShell() {
  const { isAuthenticated } = useApp();
  const location = useLocation();
  // Conversa aberta no celular ocupa a tela toda, como em um app de mensagens.
  const inGroupChat = Boolean(useMatch('/mensagens/grupo/:groupId'));
  const inChat = Boolean(useMatch('/mensagens/:userId')) || inGroupChat;

  const [, section = '', id = ''] = location.pathname.split('/');
  const pageKey = section === 'perfil' || section === 'post' ? `${section}/${id}` : section;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pageKey]);

  const { expanded } = useSidebar();

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <UIProvider>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <Sidebar />
      <div data-sidebar={expanded ? 'expanded' : 'collapsed'} className="transition-[padding] duration-200 ease-out md:pl-[4.75rem] md:sb:pl-64">
        {/* O sticky fica neste invólucro: no <header>, ele ficaria preso à própria altura e a barra rolaria junto com a página */}
        <div className={cn('sticky top-0 z-30', inChat && 'hidden md:block')}>
          <TopBar />
        </div>
        <main
          id="conteudo"
          tabIndex={-1}
          className={cn(
            'mx-auto w-full max-w-[72rem] outline-none',
            inChat ? 'md:px-5 md:pt-6 lg:px-8' : 'px-3 pb-28 pt-4 sm:px-5 md:pb-12 md:pt-6 lg:px-8',
          )}
        >
          <div key={pageKey} className="animate-page-in">
            <Outlet />
          </div>
        </main>
      </div>
      {!inChat && <BottomNav />}
    </UIProvider>
  );
}
