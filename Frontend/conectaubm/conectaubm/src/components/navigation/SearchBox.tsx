import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Search, X } from 'lucide-react';
import { AcademicLine } from '@/components/ui/Academic';
import { Avatar } from '@/components/ui/Avatar';
import { ME, useApp } from '@/context/AppContext';
import { TRENDING_TAGS } from '@/data/catalog';
import { cn } from '@/utils/cn';
import { searchUsers } from '@/utils/search';

interface SearchBoxProps {
  className?: string;
}

/** Barra de pesquisa do topo: histórico e sugestões ao focar, resultados instantâneos ao digitar. */
export function SearchBox({ className }: SearchBoxProps) {
  const { users, state, addSearchHistory, removeSearchHistory } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const people = useMemo(
    () => searchUsers(Object.values(users).filter((user) => user.id !== ME), query).slice(0, 5),
    [users, query],
  );

  // Fecha ao navegar e ao clicar fora.
  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Atalho "/" foca a pesquisa.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== '/' || /INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.isContentEditable) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const go = (term: string) => {
    const value = term.trim();
    if (!value) return;
    addSearchHistory(value);
    setQuery(value);
    setOpen(false);
    inputRef.current?.blur();
    navigate(`/pesquisa?q=${encodeURIComponent(value)}`);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    go(query);
  };

  const typing = query.trim().length > 0;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <form onSubmit={submit} role="search">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-mist" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Pesquisar pessoas, cursos e interesses"
          aria-label="Pesquisar pessoas, cursos e interesses"
          autoComplete="off"
          className="field h-11 rounded-full border-white/10 bg-white/[0.08] py-0 pl-11 pr-12 focus:border-sun/60 focus:bg-white/[0.12] [&::-webkit-search-cancel-button]:hidden"
        />
        {typing ? (
          <button
            type="button"
            aria-label="Limpar pesquisa"
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-mist hover:bg-white/10 hover:text-white"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/10 px-1.5 text-xs font-semibold text-mist lg:block">
            /
          </kbd>
        )}
      </form>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 animate-menu-in overflow-hidden rounded-2xl border border-white/10 bg-ink-600 shadow-float">
          {typing ? (
            <>
              {people.length > 0 ? (
                <ul className="p-1.5">
                  {people.map((user) => (
                    <li key={user.id}>
                      <Link
                        to={`/perfil/${user.id}`}
                        className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.08]"
                        onClick={() => addSearchHistory(query)}
                      >
                        <Avatar user={user} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-white">{user.name}</span>
                          <AcademicLine user={user} compact className="text-xs" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 pb-1 pt-4 text-sm text-fog">
                  Nenhum estudante encontrado para “{query.trim()}”.
                </p>
              )}
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-3 text-left text-sm font-semibold text-brand-200 transition-colors hover:bg-white/[0.06]"
                onClick={() => go(query)}
              >
                <Search className="size-4" aria-hidden />
                <span className="min-w-0 flex-1 truncate">Ver todos os resultados para “{query.trim()}”</span>
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </>
          ) : (
            <div className="p-4">
              {state.searchHistory.length > 0 && (
                <>
                  <p className="mb-1.5 text-xs font-semibold text-mist">Pesquisas recentes</p>
                  <ul className="-mx-2 mb-4">
                    {state.searchHistory.slice(0, 4).map((term) => (
                      <li key={term} className="flex items-center">
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-white transition-colors hover:bg-white/[0.08]"
                          onClick={() => go(term)}
                        >
                          <Clock className="size-4 shrink-0 text-mist" aria-hidden />
                          <span className="truncate">{term}</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Remover “${term}” do histórico`}
                          className="grid size-8 shrink-0 place-items-center rounded-lg text-mist hover:bg-white/10 hover:text-white"
                          onClick={() => removeSearchHistory(term)}
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p className="mb-2 text-xs font-semibold text-mist">Em alta no campus</p>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.8125rem] font-medium text-brand-200 transition-colors hover:border-brand-400 hover:bg-brand/20"
                    onClick={() => go(`#${tag}`)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
