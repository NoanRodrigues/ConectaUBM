import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Inbox, MessageCircle, Search, Send, UserMinus, UserRound, Users } from 'lucide-react';
import { MutualLine, StudentRow } from '@/components/profile/StudentCard';
import { Button, buttonClass, IconButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/Feedback';
import { Menu } from '@/components/ui/Menu';
import { PillTabs } from '@/components/ui/Tabs';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import type { ConnectionStatus, User } from '@/types';
import { firstName, normalize } from '@/utils/format';
import { MoreHorizontal } from 'lucide-react';

type Tab = 'connections' | 'received' | 'sent';

export function FriendsPage() {
  const { users, state, counts, acceptRequest, declineRequest, cancelRequest, disconnect, startConversation } = useApp();
  const { success, toast } = useToast();
  const navigate = useNavigate();
  // ?aba=recebidas: o ícone de solicitações do cabeçalho abre direto nesta aba
  const [params] = useSearchParams();
  const asked = params.get('aba') === 'recebidas';
  const [tab, setTab] = useState<Tab>(asked || counts.friendRequests > 0 ? 'received' : 'connections');
  useEffect(() => {
    if (asked) setTab('received');
  }, [asked, params]);
  const [filter, setFilter] = useState('');
  const [removing, setRemoving] = useState<User | null>(null);

  const byStatus = useMemo(() => {
    const pick = (status: ConnectionStatus) =>
      Object.keys(state.connections)
        .filter((id) => state.connections[id] === status)
        .map((id) => users[id])
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
    return { connections: pick('connected'), received: pick('pending_received'), sent: pick('pending_sent') };
  }, [state.connections, users]);

  const visibleConnections = byStatus.connections.filter((user) => normalize(`${user.name} ${user.course}`).includes(normalize(filter)));

  const openChat = (user: User) => {
    startConversation(user.id);
    navigate(`/mensagens/${user.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-[1.6rem] font-bold leading-tight text-white sm:text-[1.85rem]">Amigos</h1>
        <p className="mt-1 text-[0.9375rem] text-fog">Suas conexões e as solicitações que estão esperando resposta.</p>
      </header>

      <PillTabs<Tab>
        className="mt-5"
        label="Seções de amigos"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'connections', label: 'Conexões', count: byStatus.connections.length },
          { id: 'received', label: 'Recebidas', count: byStatus.received.length },
          { id: 'sent', label: 'Enviadas', count: byStatus.sent.length },
        ]}
      />

      <div key={tab} className="mt-4 animate-fade-in">
        {tab === 'connections' && (
          <>
            {byStatus.connections.length > 5 && (
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-mist" aria-hidden />
                <input
                  type="search"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Buscar entre suas conexões"
                  aria-label="Buscar entre suas conexões"
                  className="field h-11 rounded-full pl-11 [&::-webkit-search-cancel-button]:hidden"
                />
              </div>
            )}
            {byStatus.connections.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={Users}
                  title="Você ainda não tem conexões"
                  description="Encontre colegas de outros cursos e envie as primeiras solicitações."
                  action={
                    <Link to="/explorar" className={buttonClass('primary')}>
                      Descobrir pessoas
                    </Link>
                  }
                />
              </div>
            ) : visibleConnections.length === 0 ? (
              <div className="card">
                <EmptyState compact icon={Search} title={`Nenhuma conexão com “${filter.trim()}”`} description="Confira a grafia ou busque pelo curso." />
              </div>
            ) : (
              <ul className="card divide-y divide-line">
                {visibleConnections.map((user) => (
                  <li key={user.id} className="p-3.5 sm:px-5">
                    <StudentRow
                      user={user}
                      action={
                        <div className="flex items-center gap-1">
                          <Button variant="secondary" size="sm" icon={<MessageCircle className="size-4" aria-hidden />} onClick={() => openChat(user)}>
                            <span className="hidden sm:inline">Mensagem</span>
                          </Button>
                          <Menu
                            label={`Mais opções para ${user.name}`}
                            buttonClassName="grid size-8 place-items-center rounded-lg text-mist transition-colors hover:bg-white/[0.08] hover:text-white"
                            items={[
                              { label: 'Ver perfil', icon: UserRound, onSelect: () => navigate(`/perfil/${user.id}`) },
                              { label: 'Desfazer conexão', icon: UserMinus, danger: true, separated: true, onSelect: () => setRemoving(user) },
                            ]}
                          >
                            <MoreHorizontal className="size-5" aria-hidden />
                          </Menu>
                        </div>
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'received' &&
          (byStatus.received.length === 0 ? (
            <div className="card">
              <EmptyState icon={Inbox} title="Nenhuma solicitação pendente" description="Quando alguém quiser se conectar com você, o pedido aparece aqui." />
            </div>
          ) : (
            <ul className="space-y-3">
              {byStatus.received.map((user) => (
                <li key={user.id} className="card p-4 sm:p-5">
                  <StudentRow
                    user={user}
                    detail={<MutualLine userId={user.id} />}
                    action={
                      <IconButton label={`Ver perfil de ${firstName(user.name)}`} size="sm" tooltip="top" onClick={() => navigate(`/perfil/${user.id}`)}>
                        <UserRound className="size-4" aria-hidden />
                      </IconButton>
                    }
                  />
                  <p className="mt-3 line-clamp-2 text-sm leading-snug text-fog">{user.bio}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
                    <Button
                      onClick={() => {
                        acceptRequest(user.id);
                        success(`Você e ${firstName(user.name)} agora estão conectados.`);
                      }}
                    >
                      Aceitar
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        declineRequest(user.id);
                        toast('Solicitação recusada.');
                      }}
                    >
                      Recusar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ))}

        {tab === 'sent' &&
          (byStatus.sent.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Send}
                title="Nenhuma solicitação enviada"
                description="Os pedidos que você enviar ficam aqui até a pessoa responder."
                action={
                  <Link to="/explorar" className={buttonClass('secondary')}>
                    Descobrir pessoas
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="card divide-y divide-line">
              {byStatus.sent.map((user) => (
                <li key={user.id} className="p-3.5 sm:px-5">
                  <StudentRow
                    user={user}
                    detail={<span className="text-xs text-mist">Aguardando resposta</span>}
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          cancelRequest(user.id);
                          toast('Solicitação cancelada.');
                        }}
                      >
                        Cancelar
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          ))}
      </div>

      <ConfirmDialog
        open={removing !== null}
        title={removing ? `Desfazer conexão com ${firstName(removing.name)}?` : ''}
        description="As publicações dessa pessoa saem do seu feed de amigos. Você pode enviar uma nova solicitação quando quiser."
        confirmLabel="Desfazer conexão"
        danger
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          disconnect(removing.id);
          toast(`Você e ${firstName(removing.name)} não estão mais conectados.`);
        }}
      />
    </div>
  );
}
