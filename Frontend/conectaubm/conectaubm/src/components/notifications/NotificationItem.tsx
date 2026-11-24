import { Link, useNavigate } from 'react-router-dom';
import { AtSign, Heart, Mail, MessageCircle, Repeat2, Send, UserCheck, UserPlus, type LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import type { AppNotification, NotificationType } from '@/types';
import { cn } from '@/utils/cn';
import { fullDate, timeAgo } from '@/utils/date';
import { firstName } from '@/utils/format';
import { describeNotification } from '@/utils/notifications';

const TYPE_ICON: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  friend_request: { icon: UserPlus, tone: 'theme-dark bg-brand-400 text-white' },
  connection_accepted: { icon: UserCheck, tone: 'bg-online text-night' },
  like: { icon: Heart, tone: 'bg-like text-night' },
  comment: { icon: MessageCircle, tone: 'theme-dark bg-brand-400 text-white' },
  repost: { icon: Repeat2, tone: 'bg-online text-night' },
  share: { icon: Send, tone: 'bg-warn text-night' },
  mention: { icon: AtSign, tone: 'theme-dark bg-brand-500 text-white' },
  message: { icon: Mail, tone: 'bg-white text-ink' },
};

function targetOf(notification: AppNotification): { to: string; label: string } {
  if (notification.type === 'message') return { to: `/mensagens/${notification.actorId}`, label: 'Responder' };
  if (notification.postId) return { to: `/post/${notification.postId}`, label: 'Ver publicação' };
  return { to: `/perfil/${notification.actorId}`, label: 'Ver perfil' };
}

/** `fresh`: chegou desde a última visita à página (fica destacada enquanto ela está aberta). */
export function NotificationItem({ notification, fresh = false }: { notification: AppNotification; fresh?: boolean }) {
  const { users, state, statusOf, setNotificationRead, acceptRequest, declineRequest } = useApp();
  const { success, toast } = useToast();
  const navigate = useNavigate();
  const actor = users[notification.actorId];
  if (!actor) return null;

  const { icon: Icon, tone } = TYPE_ICON[notification.type];
  const target = targetOf(notification);
  const postExists = !notification.postId || state.posts.some((post) => post.id === notification.postId);
  const pendingRequest = notification.type === 'friend_request' && !notification.resolved && statusOf(actor.id) === 'pending_received';

  const open = () => {
    setNotificationRead(notification.id, true);
    navigate(postExists ? target.to : `/perfil/${actor.id}`);
  };

  return (
    <li className={cn('relative flex gap-3.5 p-4 transition-colors sm:px-5', fresh && 'bg-brand-900')}>
      {fresh && <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-sun" aria-hidden />}

      <Link to={`/perfil/${actor.id}`} className="relative h-fit shrink-0" aria-label={`Perfil de ${actor.name}`}>
        <Avatar user={actor} size="md" zoom className="size-11" />
        <span className={cn('absolute -bottom-1 -right-1 grid size-[1.375rem] place-items-center rounded-full ring-[3px] ring-ink-800', tone)}>
          <Icon className="size-3" strokeWidth={2.5} aria-hidden />
        </span>
      </Link>

      <div className="min-w-0 flex-1">
        <button type="button" className="block w-full rounded-lg text-left" onClick={open}>
          <p className="text-[0.9375rem] leading-snug text-fog">
            <strong className="font-bold text-white">{actor.name}</strong> {describeNotification(notification)}
          </p>
          {notification.excerpt && <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/80">“{notification.excerpt}”</p>}
          <p className="mt-1 text-xs text-mist" title={fullDate(notification.createdAt)}>
            {timeAgo(notification.createdAt)}
            {fresh && <span className="sr-only">, nova</span>}
          </p>
        </button>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {pendingRequest ? (
            <>
              <Button
                size="sm"
                onClick={() => {
                  acceptRequest(actor.id);
                  success(`Você e ${firstName(actor.name)} agora estão conectados.`);
                }}
              >
                Aceitar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  declineRequest(actor.id);
                  toast('Solicitação recusada.');
                }}
              >
                Recusar
              </Button>
            </>
          ) : (
            postExists && (
              <Button size="sm" variant="secondary" onClick={open}>
                {target.label}
              </Button>
            )
          )}
        </div>
      </div>

    </li>
  );
}
