import type { AppNotification, NotificationCategory, NotificationType } from '@/types';

export const CATEGORY_OF: Record<NotificationType, NotificationCategory> = {
  friend_request: 'connections',
  connection_accepted: 'connections',
  like: 'likes',
  comment: 'comments',
  repost: 'reposts',
  share: 'reposts',
  mention: 'mentions',
  message: 'messages',
};

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  connections: 'Conexões',
  likes: 'Curtidas',
  comments: 'Comentários',
  reposts: 'Reposts',
  mentions: 'Marcações',
  messages: 'Mensagens',
};

/** Texto da ação, exibido depois do nome de quem a realizou. */
export function describeNotification(notification: AppNotification): string {
  switch (notification.type) {
    case 'friend_request':
      if (notification.resolved === 'accepted') return 'agora é sua conexão.';
      if (notification.resolved === 'declined') return 'enviou uma solicitação, que você recusou.';
      return 'quer se conectar com você.';
    case 'connection_accepted':
      return 'aceitou sua solicitação de conexão.';
    case 'like':
      // Curtida em comentário vem com o trecho do comentário; na publicação, sem trecho
      return notification.excerpt ? 'curtiu seu comentário:' : 'curtiu sua publicação.';
    case 'comment':
      return 'comentou na sua publicação:';
    case 'repost':
      return 'repostou sua publicação.';
    case 'share':
      return 'compartilhou sua publicação.';
    case 'mention':
      return 'marcou você em um comentário:';
    case 'message':
      return 'enviou uma mensagem:';
  }
}
