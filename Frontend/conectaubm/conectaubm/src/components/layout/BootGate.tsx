import type { ReactNode } from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Spinner } from '@/components/ui/Spinner';
import { useApp } from '@/context/AppContext';

/**
 * Ao abrir o app com uma sessão salva, espera a API devolver o perfil e o feed antes de
 * mostrar as telas (assim nenhuma página aparece vazia por um instante).
 * Se a API não responder, oferece tentar de novo ou sair.
 */
export function BootGate({ children }: { children: ReactNode }) {
  const { booting, bootError, retryBoot, logout } = useApp();

  if (booting) {
    return (
      <div className="theme-dark theme-navy navy-surface grid min-h-dvh place-items-center px-6" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-5 text-center">
          <Logo markClassName="size-12" textClassName="text-2xl" />
          <Spinner className="size-6 text-brand-300" />
          <p className="text-sm text-fog">Carregando sua comunidade…</p>
        </div>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="theme-dark theme-navy navy-surface grid min-h-dvh place-items-center px-6">
        <div className="card w-full max-w-md p-6 text-center" role="alert">
          <span className="mx-auto grid size-12 place-items-center rounded-squircle bg-danger/15 text-danger">
            <WifiOff className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-white">Sem conexão com o servidor</h1>
          <p className="mt-2 text-sm text-fog">{bootError}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={retryBoot}>Tentar de novo</Button>
            <Button variant="ghost" onClick={logout}>
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
