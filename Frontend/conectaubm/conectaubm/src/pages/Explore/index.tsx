import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Search, SearchX, SlidersHorizontal, Users, X } from 'lucide-react';
import { StudentCard } from '@/components/profile/StudentCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, StudentSkeleton } from '@/components/ui/Feedback';
import { Chip } from '@/components/ui/Form';
import { Popover } from '@/components/ui/Popover';
import { ME, useApp } from '@/context/AppContext';
import { COURSES, INTERESTS, PERIODS } from '@/data/catalog';
import type { ID, User } from '@/types';
import { cn } from '@/utils/cn';
import { normalize, plural } from '@/utils/format';

const filterButton = (active: boolean) =>
  cn(
    'flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors',
    active ? 'border-brand-400 bg-brand/35 text-white' : 'border-line bg-white/[0.04] text-fog hover:border-white/20 hover:text-white',
  );

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="mt-9 first:mt-6">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-fog">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const MAYBE_COUNT = 6;

function Grid({ users, onDismiss }: { users: User[]; onDismiss?: (user: User) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <StudentCard key={user.id} user={user} onDismiss={onDismiss ? () => onDismiss(user) : undefined} />
      ))}
    </div>
  );
}

export function ExplorePage() {
  const { users, me, state, statusOf, mutualsOf, dismissSuggestion, loadDirectory } = useApp();
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showAllOthers, setShowAllOthers] = useState(false);

  const name = params.get('nome') ?? '';
  const course = params.get('curso') ?? '';
  const period = params.get('periodo') ?? '';
  const interests = useMemo(() => (params.get('interesse') ?? '').split(',').filter(Boolean), [params]);
  const onlyMutuals = params.get('comum') === '1';
  const filtering = Boolean(name.trim() || course || period || interests.length || onlyMutuals);

  // A lista de estudantes (com as conexões de cada um, para as "em comum") vem da API ao abrir.
  useEffect(() => {
    let alive = true;
    loadDirectory()
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [loadDirectory]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const toggleInterest = (interest: string) => {
    const next = interests.includes(interest) ? interests.filter((item) => item !== interest) : [...interests, interest];
    setParam('interesse', next.join(','));
  };

  const students = useMemo(() => Object.values(users).filter((user) => user.id !== ME), [users]);

  // As seções são montadas uma vez por visita (assim que a lista chega), para os cards não mudarem de lugar ao conectar.
  const [sections, setSections] = useState<{ maybe: ID[]; others: ID[] }>({ maybe: [], others: [] });
  const sectionsBuilt = useRef(false);
  useEffect(() => {
    if (loading || sectionsBuilt.current) return;
    sectionsBuilt.current = true;
    const candidates = students.filter((user) => statusOf(user.id) !== 'connected');
    // Fila completa de "Talvez você conheça": ao dispensar alguém no X, o próximo da fila entra
    const maybe = [...candidates]
      .map((user) => ({ user, weight: mutualsOf(user.id).length * 2 + (user.course === me.course ? 3 : 0) }))
      .filter((entry) => entry.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .map((entry) => entry.user.id);
    const others = candidates.filter((user) => user.course !== me.course).map((user) => user.id);
    setSections({ maybe, others });
    // Só na primeira vez que a lista chega
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const results = useMemo(() => {
    const term = normalize(name);
    return students
      .filter((user) => {
        if (term && !normalize(`${user.name} ${user.bio}`).includes(term)) return false;
        if (course && user.course !== course) return false;
        if (period === 'none' && user.period !== null) return false;
        if (period && period !== 'none' && user.period !== Number(period)) return false;
        if (interests.length && !interests.some((interest) => user.interests.includes(interest))) return false;
        if (onlyMutuals && mutualsOf(user.id).length === 0) return false;
        return true;
      })
      .sort((a, b) => mutualsOf(b.id).length - mutualsOf(a.id).length || a.name.localeCompare(b.name));
  }, [students, name, course, period, interests, onlyMutuals, mutualsOf]);

  const dismissed = state.dismissedSuggestionIds;
  const maybe = sections.maybe
    .filter((id) => !dismissed.includes(id))
    .slice(0, MAYBE_COUNT)
    .map((id) => users[id])
    .filter(Boolean);
  // Quem foi dispensado ou já aparece acima não se repete nesta seção
  const others = sections.others
    .filter((id) => !dismissed.includes(id) && !maybe.some((user) => user.id === id))
    .map((id) => users[id])
    .filter(Boolean);

  return (
    <div>
      <header>
        <h1 className="text-[1.6rem] font-bold leading-tight text-white sm:text-[1.85rem]">Explorar</h1>
        <p className="mt-1 text-[0.9375rem] text-fog">Conheça estudantes de outros cursos e períodos e faça novas conexões.</p>
      </header>

      {/* Filtros */}
      <div className="mt-5 space-y-3">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-mist" aria-hidden />
          <input
            type="search"
            value={name}
            onChange={(event) => setParam('nome', event.target.value)}
            placeholder="Buscar estudantes pelo nome"
            aria-label="Buscar estudantes pelo nome"
            className="field h-11 rounded-full pl-11 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>

        <div className="no-scrollbar -mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <SlidersHorizontal className="hidden size-4 shrink-0 text-mist sm:block" aria-hidden />
          <select
            value={course}
            onChange={(event) => setParam('curso', event.target.value)}
            aria-label="Filtrar por curso"
            className={cn('field h-10 w-auto shrink-0 rounded-full py-0 pl-4 text-sm font-semibold', course ? 'border-brand-400 bg-brand/35' : 'bg-white/[0.04] text-fog')}
          >
            <option value="">Todos os cursos</option>
            {COURSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={period}
            onChange={(event) => setParam('periodo', event.target.value)}
            aria-label="Filtrar por período"
            className={cn('field h-10 w-auto shrink-0 rounded-full py-0 pl-4 text-sm font-semibold', period ? 'border-brand-400 bg-brand/35' : 'bg-white/[0.04] text-fog')}
          >
            <option value="">Todos os períodos</option>
            {PERIODS.map((item) => (
              <option key={item} value={item}>
                {item}º período
              </option>
            ))}
            <option value="none">Período não informado</option>
          </select>

          <div className="shrink-0 max-sm:static">
            <Popover
              buttonClassName={filterButton(interests.length > 0)}
              panelClassName="w-[min(22rem,calc(100vw-1.5rem))] max-sm:fixed max-sm:inset-x-3 max-sm:top-auto max-sm:w-auto"
              button={
                <>
                  Interesses
                  {interests.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-white/20 text-[0.6875rem]">{interests.length}</span>}
                  <ChevronDown className="size-4" aria-hidden />
                </>
              }
            >
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[0.8125rem] font-semibold text-fog">Mostrar quem curte</p>
                {interests.length > 0 && (
                  <button type="button" className="text-[0.8125rem] font-semibold text-brand-300 hover:underline" onClick={() => setParam('interesse', '')}>
                    Limpar
                  </button>
                )}
              </div>
              <div className="flex max-h-64 flex-wrap gap-1.5 overflow-y-auto">
                {INTERESTS.map((interest) => (
                  <Chip key={interest} active={interests.includes(interest)} onClick={() => toggleInterest(interest)}>
                    {interest}
                  </Chip>
                ))}
              </div>
            </Popover>
          </div>

          <button type="button" aria-pressed={onlyMutuals} className={filterButton(onlyMutuals)} onClick={() => setParam('comum', onlyMutuals ? '' : '1')}>
            <Users className="size-4" aria-hidden />
            Conexões em comum
          </button>

          {filtering && (
            <button
              type="button"
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand-300 hover:bg-white/[0.06]"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
            >
              <X className="size-4" aria-hidden />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
          {Array.from({ length: 6 }, (_, index) => (
            <StudentSkeleton key={index} />
          ))}
        </div>
      ) : filtering ? (
        <section className="mt-6 animate-fade-in" aria-live="polite">
          <p className="mb-4 text-sm text-fog">
            <strong className="font-semibold text-white">{results.length}</strong> {plural(results.length, 'estudante encontrado', 'estudantes encontrados')}
          </p>
          {results.length > 0 ? (
            <Grid users={results} />
          ) : (
            <div className="card">
              <EmptyState
                icon={SearchX}
                title="Ninguém com esses filtros"
                description="Tente outro curso ou período, ou remova algum interesse para ampliar a busca."
                action={
                  <Button variant="secondary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                    Limpar filtros
                  </Button>
                }
              />
            </div>
          )}
        </section>
      ) : (
        <div className="animate-fade-in">
          {maybe.length > 0 && (
            <Section title="Talvez você conheça" description="Gente do seu curso ou com conexões em comum com você.">
              <Grid users={maybe} onDismiss={(user) => dismissSuggestion(user.id)} />
            </Section>
          )}
          <Section title="Conheça estudantes de outros cursos" description="A UBM é maior que a sua sala. Dê o primeiro oi.">
            <Grid users={showAllOthers ? others : others.slice(0, 6)} />
            {others.length > 6 && !showAllOthers && (
              <div className="mt-5 text-center">
                <Button variant="secondary" onClick={() => setShowAllOthers(true)}>
                  Mostrar mais {others.length - 6} estudantes
                </Button>
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
