import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, ChevronRight, Clock, Hash, Search, SearchX, X } from 'lucide-react';
import { PostCard } from '@/components/posts/PostCard';
import { MutualLine, StudentRow } from '@/components/profile/StudentCard';
import { EmptyState } from '@/components/ui/Feedback';
import { PillTabs } from '@/components/ui/Tabs';
import { ME, useApp } from '@/context/AppContext';
import { COURSES, TRENDING_TAGS } from '@/data/catalog';
import type { User } from '@/types';
import { isArchived } from '@/utils/feed';
import { normalize, plural } from '@/utils/format';
import { searchCourses, searchInterests, searchPosts, searchUsers } from '@/utils/search';

type Tab = 'all' | 'people' | 'posts' | 'courses' | 'interests';

function SuggestionChip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-line bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-fog transition-colors hover:border-brand-400 hover:bg-brand/20 hover:text-white"
    >
      {children}
    </button>
  );
}

function ResultHeading({ title, count, onMore }: { title: string; count: number; onMore?: () => void }) {
  return (
    <div className="mb-2.5 mt-7 flex items-baseline justify-between first:mt-0">
      <h2 className="text-base font-bold text-white">
        {title} <span className="ml-1 text-sm font-medium text-mist">{count}</span>
      </h2>
      {onMore && (
        <button type="button" className="text-[0.8125rem] font-semibold text-brand-300 hover:underline" onClick={onMore}>
          Ver todos
        </button>
      )}
    </div>
  );
}

export function SearchPage() {
  const { users, state, addSearchHistory, removeSearchHistory, clearSearchHistory } = useApp();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [tab, setTab] = useState<Tab>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const setQuery = (value: string) => {
    setParams(value ? { q: value } : {}, { replace: true });
  };

  // Uma nova pesquisa volta para a aba "Tudo".
  useEffect(() => setTab('all'), [query]);

  // Guarda no histórico depois que a pessoa para de digitar.
  useEffect(() => {
    if (query.trim().length < 3) return;
    const handle = window.setTimeout(() => addSearchHistory(query), 1400);
    return () => window.clearTimeout(handle);
  }, [query, addSearchHistory]);

  const students = useMemo(() => Object.values(users).filter((user) => user.id !== ME), [users]);
  const term = query.trim();

  const results = useMemo(() => {
    const hidden = new Set(state.hiddenPostIds);
    return {
      people: searchUsers(students, term),
      posts: searchPosts(state.posts, users, term)
        .filter((post) => !hidden.has(post.id) && !isArchived(post))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      courses: searchCourses(term),
      interests: searchInterests(term, students),
    };
  }, [students, state.posts, state.hiddenPostIds, users, term]);

  const total = results.people.length + results.posts.length + results.courses.length + results.interests.length;

  const matchDetail = (user: User) => {
    const needle = normalize(term.replace(/^#/, ''));
    const interest = user.interests.find((item) => normalize(item).includes(needle));
    if (interest && !normalize(user.name).includes(needle)) return <span className="text-xs text-brand-200">Curte {interest}</span>;
    return <MutualLine userId={user.id} />;
  };

  const peopleList = (list: User[]) => (
    <ul className="card divide-y divide-line">
      {list.map((user) => (
        <li key={user.id} className="p-3.5 sm:px-5">
          <StudentRow user={user} detail={matchDetail(user)} />
        </li>
      ))}
    </ul>
  );

  const linkList = (items: string[], kind: 'curso' | 'interesse') => (
    <ul className="card divide-y divide-line">
      {items.map((item) => {
        const count = students.filter((user) => (kind === 'curso' ? user.course === item : user.interests.includes(item))).length;
        const Icon = kind === 'curso' ? BookOpen : Hash;
        return (
          <li key={item}>
            <Link to={`/explorar?${kind}=${encodeURIComponent(item)}`} className="flex items-center gap-3.5 p-3.5 transition-colors hover:bg-white/[0.04] sm:px-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-squircle bg-brand/25 text-brand-200">
                <Icon className="size-[1.125rem]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9375rem] font-bold text-white">{item}</span>
                <span className="block text-[0.8125rem] text-mist">
                  {count} {plural(count, 'estudante', 'estudantes')}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-mist" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[1.6rem] font-bold leading-tight text-white sm:text-[1.85rem]">Pesquisar</h1>

      <form
        role="search"
        className="relative mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          addSearchHistory(query);
          inputRef.current?.blur();
        }}
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-mist" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome, curso, interesse ou palavra-chave"
          aria-label="Pesquisar por nome, curso, interesse ou palavra-chave"
          autoComplete="off"
          className="field h-12 rounded-full pl-12 pr-12 text-base [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Limpar pesquisa"
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-mist hover:bg-white/10 hover:text-white"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            <X className="size-[1.125rem]" aria-hidden />
          </button>
        )}
      </form>

      {!term ? (
        <div className="mt-7 animate-fade-in space-y-8">
          {state.searchHistory.length > 0 && (
            <section aria-labelledby="search-history">
              <div className="mb-1.5 flex items-baseline justify-between">
                <h2 id="search-history" className="text-base font-bold text-white">
                  Pesquisas recentes
                </h2>
                <button type="button" className="text-[0.8125rem] font-semibold text-brand-300 hover:underline" onClick={clearSearchHistory}>
                  Limpar histórico
                </button>
              </div>
              <ul className="card divide-y divide-line">
                {state.searchHistory.map((item) => (
                  <li key={item} className="flex items-center pr-2">
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-3.5 p-3.5 text-left transition-colors hover:bg-white/[0.04] sm:pl-5" onClick={() => setQuery(item)}>
                      <Clock className="size-[1.125rem] shrink-0 text-mist" aria-hidden />
                      <span className="truncate text-[0.9375rem] text-white">{item}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Remover “${item}” do histórico`}
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-mist hover:bg-white/10 hover:text-white"
                      onClick={() => removeSearchHistory(item)}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="search-trending">
            <h2 id="search-trending" className="mb-3 text-base font-bold text-white">
              Em alta no campus
            </h2>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map((tag) => (
                <SuggestionChip key={tag} onClick={() => setQuery(`#${tag}`)}>
                  #{tag}
                </SuggestionChip>
              ))}
            </div>
          </section>

          <section aria-labelledby="search-courses">
            <h2 id="search-courses" className="mb-3 text-base font-bold text-white">
              Procurar por curso
            </h2>
            <div className="flex flex-wrap gap-2">
              {COURSES.slice(0, 12).map((course) => (
                <SuggestionChip key={course} onClick={() => setQuery(course)}>
                  {course}
                </SuggestionChip>
              ))}
            </div>
          </section>
        </div>
      ) : total === 0 ? (
        <div className="card mt-6 animate-fade-in">
          <EmptyState
            icon={SearchX}
            title={`Nenhum resultado para “${term}”`}
            description="Confira a grafia, use menos palavras ou tente o nome de um curso ou interesse."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {['Engenharia', 'Futsal', '#HackathonUBM'].map((suggestion) => (
                  <SuggestionChip key={suggestion} onClick={() => setQuery(suggestion)}>
                    {suggestion}
                  </SuggestionChip>
                ))}
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-5">
          <PillTabs<Tab>
            label="Tipo de resultado"
            value={tab}
            onChange={setTab}
            items={[
              { id: 'all', label: 'Tudo' },
              { id: 'people', label: 'Pessoas', count: results.people.length },
              { id: 'posts', label: 'Publicações', count: results.posts.length },
              { id: 'courses', label: 'Cursos', count: results.courses.length },
              { id: 'interests', label: 'Interesses', count: results.interests.length },
            ]}
          />

          <div key={tab} className="mt-5 animate-fade-in" aria-live="polite">
            {tab === 'all' && (
              <>
                {results.people.length > 0 && (
                  <>
                    <ResultHeading title="Pessoas" count={results.people.length} onMore={results.people.length > 4 ? () => setTab('people') : undefined} />
                    {peopleList(results.people.slice(0, 4))}
                  </>
                )}
                {results.courses.length > 0 && (
                  <>
                    <ResultHeading title="Cursos" count={results.courses.length} onMore={results.courses.length > 3 ? () => setTab('courses') : undefined} />
                    {linkList(results.courses.slice(0, 3), 'curso')}
                  </>
                )}
                {results.interests.length > 0 && (
                  <>
                    <ResultHeading title="Interesses" count={results.interests.length} onMore={results.interests.length > 3 ? () => setTab('interests') : undefined} />
                    {linkList(results.interests.slice(0, 3), 'interesse')}
                  </>
                )}
                {results.posts.length > 0 && (
                  <>
                    <ResultHeading title="Publicações" count={results.posts.length} onMore={results.posts.length > 2 ? () => setTab('posts') : undefined} />
                    <div className="space-y-4">
                      {results.posts.slice(0, 2).map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {tab === 'people' &&
              (results.people.length > 0 ? peopleList(results.people) : <TabEmpty label="Nenhuma pessoa" term={term} />)}
            {tab === 'posts' &&
              (results.posts.length > 0 ? (
                <div className="space-y-4">
                  {results.posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <TabEmpty label="Nenhuma publicação" term={term} />
              ))}
            {tab === 'courses' &&
              (results.courses.length > 0 ? linkList(results.courses, 'curso') : <TabEmpty label="Nenhum curso" term={term} />)}
            {tab === 'interests' &&
              (results.interests.length > 0 ? linkList(results.interests, 'interesse') : <TabEmpty label="Nenhum interesse" term={term} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function TabEmpty({ label, term }: { label: string; term: string }) {
  return (
    <div className="card">
      <EmptyState compact icon={SearchX} title={`${label} para “${term}”`} description="Veja as outras abas ou tente outra palavra." />
    </div>
  );
}
