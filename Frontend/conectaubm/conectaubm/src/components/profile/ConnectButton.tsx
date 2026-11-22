import { useEffect, useRef, useState } from 'react';
import { Check, Clock, UserCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import type { ID } from '@/types';
import { cn } from '@/utils/cn';
import { firstName } from '@/utils/format';

interface ConnectButtonProps {
  userId: ID;
  size?: 'sm' | 'md';
  className?: string;
  /** Rótulos curtos para listas estreitas ("Enviada" em vez de "Solicitação enviada"). */
  compact?: boolean;
}

/**
 * Botão de conexão com os quatro estados da relação:
 * Conectar → Solicitação enviada → Conectado (e "Aceitar" quando o pedido veio da outra pessoa).
 */
export function ConnectButton({ userId, size = 'md', className, compact = false }: ConnectButtonProps) {
  const { users, statusOf, connect, cancelRequest, acceptRequest, disconnect } = useApp();
  const { success, toast } = useToast();
  const status = statusOf(userId);
  const previous = useRef(status);
  const [celebrating, setCelebrating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const user = users[userId];

  // Pequena comemoração quando a conexão é confirmada.
  useEffect(() => {
    if (previous.current !== 'connected' && status === 'connected') {
      setCelebrating(true);
      const handle = window.setTimeout(() => setCelebrating(false), 750);
      previous.current = status;
      return () => window.clearTimeout(handle);
    }
    previous.current = status;
  }, [status]);

  if (!user) return null;
  const name = firstName(user.name);
  const iconClass = 'size-4';

  if (status === 'connected') {
    return (
      <>
        <Tooltip label="Desfazer conexão" side="top" className={className}>
          <Button
            variant="subtle"
            size={size}
            className={cn('w-full', celebrating && 'animate-linked')}
            icon={<UserCheck className={iconClass} aria-hidden />}
            onClick={() => setConfirming(true)}
          >
            Conectado
          </Button>
        </Tooltip>
        <ConfirmDialog
          open={confirming}
          title={`Desfazer conexão com ${name}?`}
          description={`As publicações de ${name} saem do seu feed de amigos. Você pode enviar uma nova solicitação quando quiser.`}
          confirmLabel="Desfazer conexão"
          danger
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            disconnect(userId);
            toast(`Você e ${name} não estão mais conectados.`);
          }}
        />
      </>
    );
  }

  if (status === 'pending_sent') {
    return (
      <Tooltip label="Cancelar solicitação" side="top" className={className}>
        <Button
          variant="secondary"
          size={size}
          className="w-full"
          icon={<Clock className={iconClass} aria-hidden />}
          onClick={() => {
            cancelRequest(userId);
            toast('Solicitação cancelada.');
          }}
        >
          {compact ? 'Enviada' : 'Solicitação enviada'}
        </Button>
      </Tooltip>
    );
  }

  if (status === 'pending_received') {
    return (
      <Button
        size={size}
        className={cn('w-full', className)}
        icon={<Check className={iconClass} aria-hidden />}
        onClick={() => {
          acceptRequest(userId);
          success(`Você e ${name} agora estão conectados.`);
        }}
      >
        Aceitar
      </Button>
    );
  }

  return (
    <Button size={size} className={cn('w-full', className)} icon={<UserPlus className={iconClass} aria-hidden />} onClick={() => connect(userId)}>
      Conectar
    </Button>
  );
}
