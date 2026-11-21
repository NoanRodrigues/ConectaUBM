import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hash } from 'lucide-react';
import { ConnectButton } from '@/components/profile/ConnectButton';
import { DismissButton, MutualLine } from '@/components/profile/StudentCard';
import { AcademicLine } from '@/components/ui/Academic';
import { Avatar } from '@/components/ui/Avatar';
import { ME, useApp } from '@/context/AppContext';
import { TRENDING_TAGS } from '@/data/catalog';
import type { User } from '@/types';
import { isArchived } from '@/utils/feed';
import { normalize, plural } from '@/utils/format';

/** Quantidades pensadas para a coluna caber inteira na tela, sem rolagem própria. */
const SUGGESTION_COUNT = 3;
const TRENDING_COUNT = 4;

/**
 * Sugestão de conexão: nome e curso em cima, sem cortes; embaixo, as conexões em comum e o botão.
 * Quando a coluna é estreita, o botão desce sozinho para uma linha própria.
 */
function SuggestionItem({ user, onDismiss }: { user: User; onDismiss: () => void }) {
  return (
    <li className="relative animate-fade-in">
      <DismissButton user={user} onDismiss={onDismiss} className="-right-1.5 -top-1.5" />
      <Link to={`/perfil/${user.id}`} className="flex items-center gap-3 rounded-xl pr-6">
        <Avatar user={user} showStatus zoom />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-bold leading-tight text-white">{user.name}</span>
          <AcademicLine user={user} className="mt-0.5" compact />
        </span>
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 pl-[3.25rem]">
        <MutualLine userId={user.id} short className="shrink-0" />
        <div className="min-w-[6.5rem] flex-1">
          <ConnectButton userId={user.id} size="sm" compact />
        </div>
      </div>
    </li>
  );
}

/** Coluna de apoio do feed (desktop): sugestões de conexão e assuntos em alta. */
export function FeedAside() {
  const { users, state, statusOf, mutualsOf, dismissSuggestion } = useApp();

  // A fila de sugestões é montada uma vez: a lista não se reordena enquanto a pessoa clica em "Conectar".
  // Ao dispensar alguém no X, o próximo da fila ocupa o lugar.
  const [queue] = useState(() =>
    Object.values(users)
      .filter((user) => user.id !== ME && statusOf(user.id) === 'none')
      .sort((a, b) => mutualsOf(b.id).length - mutualsOf(a.id).length)
      .map((user) => user.id),
  );
  const suggestions = queue
    .filter((id) => !state.dismissedSuggestionIds.includes(id))
    .slice(0, SUGGESTION_COUNT)
    .map((id) => users[id])
    .filter(Boolean);

  const trending = useMemo(
    () =>
      TRENDING_TAGS.map((tag) => {
        const needle = normalize(`#${tag}`);
        return { tag, count: state.posts.filter((post) => !isArchived(post) && normalize(post.text).includes(needle)).length };
      })
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, TRENDING_COUNT),
    [state.posts],
  );

  // O topo fixo (91px) é a posição em que a coluna já aparece com a página no início:
  // 67px da barra superior + 24px de respiro do conteúdo. Assim ela não se desloca ao começar a rolar.
  // Fica fixa ao rolar o feed sempre que cabe inteira na janela. Em janelas baixas demais para isso,
  // ela rola junto com a página, para nada ficar inalcançável.
  return (
    <div className="top-[91px] space-y-4 [@media(min-height:760px)_and_(min-width:1280px)]:sticky [@media(min-height:880px)]:sticky">
      <section className="card p-4" aria-labelledby="aside-suggestions">
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 id="aside-suggestions" className="text-[0.9375rem] font-bold text-white">
            Sugestões para você
          </h2>
          <Link to="/explorar" className="text-[0.8125rem] font-semibold text-brand-300 hover:underline">
            Ver mais
          </Link>
        </div>
        <ul className="space-y-3.5">
          {suggestions.map((user) => (
            <SuggestionItem key={user.id} user={user} onDismiss={() => dismissSuggestion(user.id)} />
          ))}
        </ul>
        {suggestions.length === 0 && (
          <p className="text-sm leading-relaxed text-mist">
            Você já viu todas as sugestões por agora. Em{' '}
            <Link to="/explorar" className="font-semibold text-brand-300 hover:underline">
              Explorar
            </Link>{' '}
            dá para encontrar qualquer estudante.
          </p>
        )}
      </section>

      <section className="card p-4" aria-labelledby="aside-trending">
        <h2 id="aside-trending" className="mb-2 text-[0.9375rem] font-bold text-white">
          Em alta no campus
        </h2>
        <ul className="-mx-2">
          {trending.map(({ tag, count }) => (
            <li key={tag}>
              <Link
                to={`/pesquisa?q=${encodeURIComponent(`#${tag}`)}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.06]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-squircle bg-brand/25 text-brand-200">
                  <Hash className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{tag}</span>
                  <span className="block text-xs text-mist">
                    {count} {plural(count, 'publicação', 'publicações')}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

     </div>
  );
}
