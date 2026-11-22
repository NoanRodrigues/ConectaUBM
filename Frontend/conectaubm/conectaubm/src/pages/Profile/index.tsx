import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Flag, GraduationCap, Layers, Link2, Mail, MessageCircle, MoreHorizontal, PenLine, Repeat2, Settings, Share2, StickyNote, UserX } from 'lucide-react';
import { PostCard } from '@/components/posts/PostCard';
import { ConnectButton } from '@/components/profile/ConnectButton';
import { HighlightsSection } from '@/components/profile/HighlightsSection';
import { Avatar } from '@/components/ui/Avatar';
import { Button, buttonClass, IconButton } from '@/components/ui/Button';
import { EmptyState, PostSkeleton, Skeleton } from '@/components/ui/Feedback';
import { Chip } from '@/components/ui/Form';
import { Menu } from '@/components/ui/Menu';
import { LineTabs } from '@/components/ui/Tabs';
import { Tooltip } from '@/components/ui/Tooltip';
import { ME, useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { useUI } from '@/context/UIContext';
import { usePolling } from '@/hooks/usePolling';
import { DEFAULT_COVER } from '@/data/mockMedia';
import { getMyServerId } from '@/services/mappers';
import { copyText } from '@/services/shareService';
import { monthYear } from '@/utils/date';
import { postsBy, repostsBy } from '@/utils/feed';
import { appLink, compact, firstName, plural } from '@/utils/format';

type Tab = 'posts' | 'reposts' | 'about';

function Stat({ value, label, to }: { value: number; label: string; to?: string }) {
  const content = (
    <>
      <span className="font-display text-xl font-bold leading-none text-white">{compact(value)}</span>
      <span className="text-[0.8125rem] text-mist">{label}</span>
    </>
  );
  const className = 'flex flex-col gap-1 rounded-xl px-1';
  return to ? (
    <Link to={to} className={`${className} transition-opacity hover:opacity-80`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

function AboutRow({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3.5 py-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-squircle bg-brand/25 text-brand-200">
        <Icon className="size-[1.125rem]" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-[0.8125rem] text-mist">{label}</dt>
        <dd className="mt-0.5 text-[0.9375rem] font-semibold text-white">{children}</dd>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { userId = ME } = useParams();
  const { users, state, me, statusOf, mutualsOf, declineRequest, startConversation, loadProfile } = useApp();
  const { openEditProfile, openShare, openComposer } = useUI();
  const { success, toast, error } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('posts');

  useEffect(() => setTab('posts'), [userId]);

  // Perfil, publicações, reposts e destaques vêm da API ao abrir (e ao trocar de perfil).
  const [load, setLoad] = useState<'loading' | 'ready' | 'missing'>('loading');
  useEffect(() => {
    let alive = true;
    setLoad('loading');
    loadProfile(userId)
      .then(() => alive && setLoad('ready'))
      .catch(() => alive && setLoad('missing'));
    return () => {
      alive = false;
    };
  }, [userId, loadProfile]);
  // Foto, capa, bio e publicações novas de quem está sendo visto
  usePolling(() => loadProfile(userId), 20000);

  const user = users[userId];
  const posts = useMemo(() => postsBy(state, userId), [state, userId]);
  const reposts = useMemo(() => repostsBy(state, userId), [state, userId]);

  // Link do próprio perfil com o id real (compartilhado por alguém): é o mesmo que /perfil/me
  if (userId !== ME && userId === getMyServerId()) return <Navigate to="/perfil/me" replace />;

  if (!user && load === 'loading') {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy>
        <div className="card overflow-hidden">
          <Skeleton className="h-36 w-full rounded-none sm:h-52" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <PostSkeleton />
      </div>
    );
  }

  if (!user || (load === 'missing' && user.partial)) {
    return (
      <div className="card mx-auto mt-6 max-w-xl">
        <EmptyState
          icon={UserX}
          title="Perfil não encontrado"
          description="Este estudante não faz parte da comunidade ou o link está incorreto."
          action={
            <Link to="/explorar" className={buttonClass('primary')}>
              Explorar estudantes
            </Link>
          }
        />
      </div>
    );
  }

  const mine = user.id === ME;
  const status = statusOf(user.id);
  const first = firstName(user.name);
  const mutuals = mine ? [] : mutualsOf(user.id).map((id) => users[id]).filter(Boolean);
  const sharedInterests = new Set(mine ? [] : me.interests);
  const canMessage = status === 'connected' || user.messagePolicy === 'everyone';
  // O link compartilhado leva o id real: 'me' só vale dentro da sessão de cada um.
  const profileUrl = appLink(`/perfil/${mine ? (getMyServerId() ?? user.id) : user.id}`);

  const share = () =>
    openShare({
      heading: mine ? 'Compartilhar meu perfil' : `Compartilhar perfil de ${first}`,
      title: `${user.name} no ConectaUBM`,
      text: `Conheça ${mine ? 'meu perfil' : `o perfil de ${user.name}`} no ConectaUBM, a rede dos estudantes da UBM.`,
      url: profileUrl,
    });

  const openChat = () => {
    startConversation(user.id);
    navigate(`/mensagens/${user.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Capa e identificação */}
      <section className="card">
        <div className="relative h-36 overflow-hidden rounded-t-[calc(1.25rem-1px)] bg-ink-950 sm:h-52">
          <img src={user.coverUrl ?? DEFAULT_COVER} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-800/70 via-transparent to-transparent" aria-hidden />
        </div>

        <div className="relative px-4 pb-5 sm:px-6">
          <div className="-mt-12 flex items-end justify-between gap-3 sm:-mt-16">
            <span className="rounded-squircle bg-ink-800 p-1.5">
              <Avatar user={user} size="2xl" showStatus zoom />
            </span>

            <div className="flex flex-wrap items-center justify-end gap-2 self-start pt-[3.75rem] sm:pt-[4.75rem]">
              {mine ? (
                <>
                  <Button variant="secondary" icon={<PenLine className="size-4" aria-hidden />} onClick={openEditProfile}>
                    Editar perfil
                  </Button>
                  <IconButton label="Compartilhar perfil" tooltip="top" className="border border-white/10" onClick={share}>
                    <Share2 className="size-[1.125rem]" aria-hidden />
                  </IconButton>
                  <Link to="/configuracoes" aria-label="Configurações" className="grid size-10 place-items-center rounded-xl border border-white/10 text-fog hover:bg-white/[0.08] hover:text-white md:hidden">
                    <Settings className="size-[1.125rem]" aria-hidden />
                  </Link>
                </>
              ) : (
                <>
                  <ConnectButton userId={user.id} className="w-auto" />
                  {status === 'pending_received' && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        declineRequest(user.id);
                        toast('Solicitação recusada.');
                      }}
                    >
                      Recusar
                    </Button>
                  )}
                  {canMessage ? (
                    <Button variant="secondary" icon={<MessageCircle className="size-4" aria-hidden />} onClick={openChat}>
                      <span className="max-sm:sr-only">Enviar mensagem</span>
                    </Button>
                  ) : (
                    <Tooltip label={`${first} só recebe mensagens de conexões`} side="top">
                      <Button variant="secondary" icon={<MessageCircle className="size-4" aria-hidden />} disabled aria-label={`Enviar mensagem. ${first} só recebe mensagens de conexões.`}>
                        <span className="max-sm:sr-only">Enviar mensagem</span>
                      </Button>
                    </Tooltip>
                  )}
                  <Menu
                    label="Mais opções do perfil"
                    buttonClassName="grid size-10 place-items-center rounded-xl border border-white/10 text-fog transition-colors hover:bg-white/[0.08] hover:text-white"
                    items={[
                      { label: 'Compartilhar perfil', icon: Share2, onSelect: share },
                      {
                        label: 'Copiar link do perfil',
                        icon: Link2,
                        onSelect: async () => ((await copyText(profileUrl)) ? success('Link do perfil copiado.') : error('Não foi possível copiar o link.')),
                      },
                      { label: 'Denunciar perfil', icon: Flag, danger: true, separated: true, onSelect: () => success(`Denúncia enviada. Vamos analisar o perfil de ${first}.`) },
                    ]}
                  >
                    <MoreHorizontal className="size-5" aria-hidden />
                  </Menu>
                </>
              )}
            </div>
          </div>

          <h1 className="mt-3 text-[1.6rem] font-bold leading-tight text-white sm:text-[1.85rem]">{user.name}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem] text-fog">
            <GraduationCap className="size-[1.125rem] text-brand-300" aria-hidden />
            {user.course}
            {user.period && <span className="rounded-md bg-brand-800 px-2 py-0.5 text-xs font-bold text-brand-100">{user.period}º período</span>}
          </p>

          {user.bio ? (
            <p className="mt-3.5 max-w-xl text-[0.9375rem] leading-relaxed text-white/90">{user.bio}</p>
          ) : (
            mine && (
              <button type="button" className="mt-3.5 text-sm font-semibold text-brand-300 hover:underline" onClick={openEditProfile}>
                Adicionar uma biografia
              </button>
            )
          )}

          {user.interests.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Interesses">
              {user.interests.map((interest) => (
                <li key={interest}>
                  <Link to={`/explorar?interesse=${encodeURIComponent(interest)}`} title={`Ver quem curte ${interest}`}>
                    <Chip active={sharedInterests.has(interest)} className="hover:border-brand-300 hover:text-white">
                      {interest}
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-line pt-4">
            <Stat value={user.connectionCount} label={plural(user.connectionCount, 'conexão', 'conexões')} to={mine ? '/amigos' : undefined} />
            <Stat value={posts.length} label={plural(posts.length, 'publicação', 'publicações')} />
            <Stat value={reposts.length} label={plural(reposts.length, 'repost', 'reposts')} />
            {mutuals.length > 0 && (
              <p className="ml-auto flex items-center gap-2 text-[0.8125rem] text-fog">
                <span className="flex -space-x-1.5">
                  {mutuals.slice(0, 3).map((friend) => (
                    <Avatar key={friend.id} user={friend} size="xs" className="rounded-squircle ring-2 ring-ink-800" />
                  ))}
                </span>
                {mutuals.length} {plural(mutuals.length, 'conexão em comum', 'conexões em comum')}
              </p>
            )}
          </div>
        </div>
      </section>

      <HighlightsSection user={user} />

      <LineTabs<Tab>
        className="mt-4"
        label="Conteúdo do perfil"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'posts', label: 'Publicações', count: posts.length },
          { id: 'reposts', label: 'Reposts', count: reposts.length },
          { id: 'about', label: 'Sobre' },
        ]}
      />

      <div key={tab} className="mt-4 animate-fade-in space-y-4">
        {tab === 'posts' &&
          (posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="card">
              <EmptyState
                icon={StickyNote}
                title={mine ? 'Você ainda não publicou nada' : `${first} ainda não publicou nada`}
                description={mine ? 'Conte como está sendo seu semestre ou divulgue um grupo de estudos.' : 'Quando houver publicações, elas aparecem aqui.'}
                action={mine ? <Button onClick={() => openComposer()}>Criar publicação</Button> : undefined}
              />
            </div>
          ))}

        {tab === 'reposts' &&
          (reposts.length > 0 ? (
            reposts.map((item) => <PostCard key={item.key} post={item.post} repost={item.repost} />)
          ) : (
            <div className="card">
              <EmptyState
                icon={Repeat2}
                title={mine ? 'Você ainda não repostou nada' : `${first} ainda não repostou nada`}
                description={mine ? 'Use o botão de repostar em uma publicação para compartilhar no seu perfil.' : 'Os reposts aparecem aqui.'}
              />
            </div>
          ))}

        {tab === 'about' && (
          <>
            <section className="card px-4 py-2 sm:px-6" aria-labelledby="about-academic">
              <h2 id="about-academic" className="pb-1 pt-3 text-base font-bold text-white">
                Informações acadêmicas
              </h2>
              <dl className="divide-y divide-line">
                <AboutRow icon={GraduationCap} label="Curso">
                  {user.course}
                </AboutRow>
                <AboutRow icon={Layers} label="Período">
                  {user.period ? `${user.period}º período` : <span className="font-normal text-fog">Não informado</span>}
                </AboutRow>
                {mine && user.email && (
                  <AboutRow icon={Mail} label="E-mail (só você vê)">
                    <span className="break-all">{user.email}</span>
                  </AboutRow>
                )}
                <AboutRow icon={CalendarDays} label="No ConectaUBM desde">
                  {monthYear(user.joinedAt)}
                </AboutRow>
              </dl>
            </section>

            <section className="card p-4 sm:p-6" aria-labelledby="about-interests">
              <h2 id="about-interests" className="text-base font-bold text-white">
                Interesses
              </h2>
              {user.interests.length > 0 ? (
                <>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {user.interests.map((interest) => (
                      <li key={interest}>
                        <Chip active={sharedInterests.has(interest)}>{interest}</Chip>
                      </li>
                    ))}
                  </ul>
                  {!mine && sharedInterests.size > 0 && user.interests.some((interest) => sharedInterests.has(interest)) && (
                    <p className="mt-3 text-[0.8125rem] text-mist">Os destacados são interesses que vocês têm em comum.</p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-fog">Nenhum interesse informado.</p>
              )}
            </section>

            {mutuals.length > 0 && (
              <section className="card p-4 sm:p-6" aria-labelledby="about-mutuals">
                <h2 id="about-mutuals" className="text-base font-bold text-white">
                  Conexões em comum
                </h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {mutuals.map((friend) => (
                    <li key={friend.id}>
                      <Link to={`/perfil/${friend.id}`} className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-white/[0.05]">
                        <Avatar user={friend} size="sm" zoom />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-white">{friend.name}</span>
                          <span className="block truncate text-xs text-mist">{friend.course}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
