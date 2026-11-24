import { useEffect, useMemo, useState } from 'react';
import { BellOff } from 'lucide-react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/Button';
import { EmptyState, ListSkeleton } from '@/components/ui/Feedback';
import { PillTabs, type TabItem } from '@/components/ui/Tabs';
import { useApp } from '@/context/AppContext';
import type { ID, NotificationCategory } from '@/types';
import { plural } from '@/utils/format';
import { CATEGORY_LABELS, CATEGORY_OF } from '@/utils/notifications';

type Filter = 'all' | NotificationCategory;

export function NotificationsPage() {
  const { state, markAllNotificationsRead, loadNotifications } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  // As novas chegam pelo WebSocket; ao abrir a página, confere a lista completa na API.
  useEffect(() => {
    let alive = true;
    loadNotifications()
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [loadNotifications]);

  // Abrir a página já conta como ver: tudo é marcado como lido e o alerta some do sino.
  // As que eram novas continuam destacadas enquanto a página está aberta (inclusive as que chegam agora).
  const [fresh, setFresh] = useState<Set<ID>>(() => new Set());
  useEffect(() => {
    const unread = state.notifications.filter((notification) => !notification.read).map((notification) => notification.id);
    if (unread.length === 0) return;
    setFresh((current) => new Set([...current, ...unread]));
    markAllNotificationsRead();
  }, [state.notifications, markAllNotificationsRead]);

  const sorted = useMemo(() => [...state.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [state.notifications]);

  const tabs = useMemo<Array<TabItem<Filter>>>(
    () => [
      { id: 'all', label: 'Todas' },
      // Mensagens já têm acesso pelo cabeçalho e pelas barras de navegação: a categoria continua
      // existindo (preferências), só não vira aba aqui. As notificações dela seguem em "Todas".
      ...(Object.keys(CATEGORY_LABELS) as NotificationCategory[])
        .filter((category) => category !== 'messages')
        .map((category) => ({
          id: category,
          label: CATEGORY_LABELS[category],
          count: sorted.filter((n) => fresh.has(n.id) && CATEGORY_OF[n.type] === category).length,
        })),
    ],
    [sorted, fresh],
  );

  const visible = sorted.filter((notification) => {
    if (filter === 'all') return true;
    return CATEGORY_OF[notification.type] === filter;
  });

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-[1.6rem] font-bold leading-tight text-white sm:text-[1.85rem]">Notificações</h1>
        <p className="mt-1 text-[0.9375rem] text-fog" aria-live="polite">
          {fresh.size > 0 ? `${fresh.size} ${plural(fresh.size, 'novidade', 'novidades')} desde a sua última visita` : 'Você está em dia com tudo.'}
        </p>
      </header>

      <PillTabs<Filter> className="-mx-3 mt-5 px-3 sm:mx-0 sm:px-0" label="Filtrar notificações" value={filter} onChange={setFilter} items={tabs} />

      <div className="card mt-4 overflow-hidden" aria-busy={loading}>
        {loading && sorted.length === 0 ? (
          <ListSkeleton rows={6} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="Nada por aqui"
            description={
              filter === 'all'
                ? 'Curtidas, comentários, solicitações e mensagens novas aparecem nesta página.'
                : 'Quando houver novidades nesta categoria, elas aparecem aqui.'
            }
            action={
              filter !== 'all' ? (
                <Button variant="secondary" onClick={() => setFilter('all')}>
                  Ver todas
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul key={filter} className="animate-fade-in divide-y divide-line">
            {visible.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} fresh={fresh.has(notification.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
