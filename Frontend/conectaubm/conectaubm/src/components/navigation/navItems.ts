import { Bell, Compass, Home, MessageCircle, User, Users, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Chave do contador exibido como selo. */
  badge?: 'notifications' | 'messages' | 'friendRequests';
  /** Casa só a rota exata (Início). */
  end?: boolean;
}

/** Itens da barra lateral. "Configurações" e "Sair" ficam no menu da conta, no rodapé da barra. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Feed', icon: Home, end: true },
  { to: '/explorar', label: 'Explorar', icon: Compass },
  { to: '/amigos', label: 'Amigos', icon: Users, badge: 'friendRequests' },
  { to: '/mensagens', label: 'Mensagens', icon: MessageCircle, badge: 'messages' },
  { to: '/notificacoes', label: 'Notificações', icon: Bell, badge: 'notifications' },
  { to: '/perfil/me', label: 'Meu perfil', icon: User },
];
