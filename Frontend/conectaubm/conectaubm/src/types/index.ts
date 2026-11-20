/**
 * Tipos de domínio do ConectaUBM.
 * São o contrato entre a interface e a futura API: ao integrar o backend,
 * as respostas devem ser mapeadas para estes formatos (ver src/services).
 */

export type ID = string;

export type MessagePolicy = 'everyone' | 'connections';

export interface User {
  id: ID;
  name: string;
  /**
   * Nome de usuário (sem @). Quando ausente, é derivado do nome (ver utils/users.ts).
   * Menções guardam o id, nunca o nome de usuário: trocar nome ou usuário não quebra menções antigas.
   */
  username?: string;
  email?: string;
  course: string;
  /** Período é opcional: o estudante pode preferir não informar. */
  period: number | null;
  bio: string;
  interests: string[];
  /** Foto enviada pelo estudante. Quando nula, usamos o avatar ilustrado gerado por avatarSeed. */
  avatarUrl: string | null;
  avatarSeed: string;
  coverUrl: string | null;
  online: boolean;
  /** Total de conexões exibido no perfil. */
  connectionCount: number;
  /** Conexões deste estudante dentro da comunidade (base para "conexões em comum"). */
  friends: ID[];
  joinedAt: string;
  messagePolicy: MessagePolicy;
  /** Conexões em comum com o usuário logado, contadas pela API. */
  mutualCount?: number;
  /** Só o resumo (nome, foto, curso) chegou da API: o perfil completo é buscado ao abrir. */
  partial?: boolean;
}

/** Relação entre o usuário logado e outro estudante. */
export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected';

export interface Media {
  id: ID;
  type: 'image' | 'video';
  /** Vazio quando o arquivo existia só na sessão em que foi enviado (ver sessionOnly). */
  url: string;
  poster?: string;
  alt: string;
  /** Vídeos enviados na demo vivem apenas na memória do navegador. */
  sessionOnly?: boolean;
}

export interface Post {
  id: ID;
  authorId: ID;
  text: string;
  media: Media[];
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  shares: number;
  reposts: number;
  repostedByMe: boolean;
  /**
   * Data em que o autor arquivou a publicação. Arquivada, ela sai do feed, do perfil e da busca,
   * mas mantém curtidas, comentários e reposts; desarquivar devolve tudo como estava.
   */
  archivedAt?: string | null;
  /** Repost com comentário: a publicação original, exibida embutida abaixo do texto. */
  quotedPostId?: ID;
  /** Total de comentários informado pela API (os comentários em si carregam ao abrir). */
  commentCount?: number;
}

/* ---------- Connecs (stories do ConectaUBM) ---------- */

/** Quem pode ver um Connec. A escolha vale só para aquele Connec. */
export type ConnecAudience = 'everyone' | 'only' | 'except';

export interface ConnecPrivacy {
  audience: ConnecAudience;
  /** 'only': quem pode ver. 'except': quem não pode ver. Vazio em 'everyone'. */
  userIds: ID[];
}

/** Fundo dos Connecs só de texto (cores da identidade do ConectaUBM). */
export type ConnecBackground = 'navy' | 'brand' | 'sun';

export interface Connec {
  id: ID;
  authorId: ID;
  /** Foto ou vídeo do Connec. Nula nos Connecs só de texto. */
  media: Media | null;
  /** Legenda (com mídia) ou o próprio conteúdo (sem mídia). */
  text: string;
  /** Fundo dos Connecs só de texto. */
  background: ConnecBackground;
  /**
   * Fundo atrás de uma foto ou vídeo que não preenche a tela (horizontal, por exemplo).
   * Ausente = automático: a própria mídia desfocada.
   */
  fill?: ConnecBackground;
  createdAt: string;
  /** createdAt + 24 h. Depois disso o Connec sai dos ativos, mas continua no histórico e nos destaques. */
  expiresAt: string;
  privacy: ConnecPrivacy;
  /** Quando foi publicado de novo a partir do histórico: o Connec de origem. */
  sourceId?: ID;
}

export interface ConnecDraft {
  media: Media | null;
  text: string;
  background: ConnecBackground;
  fill?: ConnecBackground;
  privacy: ConnecPrivacy;
  sourceId?: ID;
}

/** Capa de um destaque: imagem enviada ou um dos Connecs. Sem capa, vale o Connec adicionado por último. */
export type HighlightCover = { kind: 'upload'; url: string } | { kind: 'connec'; connecId: ID };

export interface HighlightItem {
  connecId: ID;
  addedAt: string;
}

/** Coleção de Connecs que o dono escolheu manter no perfil, sem prazo de expiração. */
export interface Highlight {
  id: ID;
  ownerId: ID;
  name: string;
  cover: HighlightCover | null;
  items: HighlightItem[];
  createdAt: string;
  updatedAt: string;
}

export interface HighlightInput {
  name: string;
  cover: HighlightCover | null;
  connecIds: ID[];
}

export interface Repost {
  id: ID;
  postId: ID;
  userId: ID;
  createdAt: string;
}

export interface Comment {
  id: ID;
  postId: ID;
  authorId: ID;
  text: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  /** Em uma resposta: id do comentário que abre a conversa (as respostas têm um só nível). */
  parentId?: ID;
  /** Em uma resposta: a quem ela se dirige, para exibir a menção. */
  replyToId?: ID;
}

/** Destino de uma resposta a um comentário. */
export interface ReplyTarget {
  parentId: ID;
  userId: ID;
  /** O comentário respondido (o que abre a conversa ou uma das respostas). */
  commentId?: ID;
}

export type MessageStatus = 'sending' | 'sent' | 'read';

export interface Message {
  id: ID;
  fromMe: boolean;
  text: string;
  createdAt: string;
  status?: MessageStatus;
  /** Cartão de perfil compartilhado na conversa (o texto fica vazio). */
  profileId?: ID;
}

/* ---------- Conversas em grupo ---------- */

export type GroupRole = 'admin' | 'member';

export interface GroupMember {
  userId: ID;
  role: GroupRole;
  joinedAt: string;
  addedBy?: ID;
}

/**
 * Mensagem de grupo. `system` registra eventos (criação, entrada, saída, mudança de nome),
 * mostrados centralizados e sem remetente.
 */
export interface GroupMessage {
  id: ID;
  senderId: ID;
  text: string;
  createdAt: string;
  kind?: 'text' | 'profile' | 'system';
  profileId?: ID;
  status?: MessageStatus;
}

export interface GroupChat {
  id: ID;
  name: string;
  /** Foto escolhida para o grupo; sem ela, aparece o ícone de grupo. */
  photoUrl: string | null;
  createdBy: ID;
  createdAt: string;
  /** Participantes atuais. Quem sai deixa de estar aqui. */
  members: GroupMember[];
  messages: GroupMessage[];
  /** Não lidas pelo usuário logado. */
  unread: number;
  /** Quando o usuário logado saiu (ou foi removido): a conversa fica só para leitura. */
  leftAt?: string | null;
  /** As mensagens já vieram da API (antes disso, só a última, para a lista). */
  loaded?: boolean;
}

export interface GroupInput {
  name: string;
  photoUrl: string | null;
  memberIds: ID[];
}

export interface Conversation {
  id: ID;
  userId: ID;
  messages: Message[];
  unread: number;
  /** Conversa iniciada por mim com alguém que ainda não é conexão e não aceitou. */
  awaitingAcceptance?: boolean;
  /** As mensagens já vieram da API (antes disso, só a última, para a lista). */
  loaded?: boolean;
  updatedAt?: string;
}

/** Mensagem recebida de quem ainda não é conexão ("Alguém quer conversar com você!"). */
export interface MessageRequest {
  id: ID;
  userId: ID;
  messages: Message[];
  createdAt: string;
}

export type NotificationType =
  | 'friend_request'
  | 'connection_accepted'
  | 'like'
  | 'comment'
  | 'repost'
  | 'mention'
  | 'message'
  | 'share';

export interface AppNotification {
  id: ID;
  type: NotificationType;
  actorId: ID;
  createdAt: string;
  read: boolean;
  postId?: ID;
  excerpt?: string;
  /** Resultado de uma solicitação de amizade já respondida. */
  resolved?: 'accepted' | 'declined';
}

export type NotificationCategory = 'connections' | 'likes' | 'comments' | 'reposts' | 'mentions' | 'messages';

export interface Settings {
  messagePolicy: MessagePolicy;
  showOnline: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  /** Avisos na tela (toasts) quando algo novo acontece. */
  liveAlerts: boolean;
  notify: Record<NotificationCategory, boolean>;
}

export interface Session {
  keepConnected: boolean;
  loggedInAt: string;
}

export interface AppState {
  session: Session | null;
  users: Record<ID, User>;
  /** Status de conexão de cada estudante em relação ao usuário logado. */
  connections: Record<ID, ConnectionStatus>;
  posts: Post[];
  reposts: Repost[];
  comments: Comment[];
  conversations: Conversation[];
  groups: GroupChat[];
  messageRequests: MessageRequest[];
  notifications: AppNotification[];
  searchHistory: string[];
  hiddenPostIds: ID[];
  /** Estudantes que o usuário dispensou das sugestões (continuam na busca e no Explorar). */
  dismissedSuggestionIds: ID[];
  /** Todos os Connecs já publicados. A expiração não apaga nada: esta lista é também o histórico. */
  connecs: Connec[];
  highlights: Highlight[];
  /** Connecs que o usuário logado já abriu. */
  seenConnecIds: ID[];
  settings: Settings;
}

/** Item do feed: uma publicação original ou um repost de alguém. */
export interface FeedItem {
  key: string;
  post: Post;
  repost?: Repost;
  sortDate: string;
}

export interface PostDraft {
  text: string;
  media: Media[];
  /** Repostar com comentário: id da publicação citada. */
  quotedPostId?: ID;
}

/** Entrar: só e-mail e senha. O perfil vem da conta já cadastrada. */
export interface LoginInput {
  email: string;
  password: string;
  keepConnected: boolean;
}

/** Cadastro: além do acesso, os dados que formam o perfil. */
export interface SignupInput extends LoginInput {
  name: string;
  course: string;
  period: number | null;
}
