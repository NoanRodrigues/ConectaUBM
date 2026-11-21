import { Globe2, UserCheck, UserX, type LucideIcon } from 'lucide-react';
import { PeoplePicker } from '@/components/people/PeoplePicker';
import type { ConnecAudience, ConnecPrivacy } from '@/types';
import { cn } from '@/utils/cn';
import { plural } from '@/utils/format';

const OPTIONS: Array<{ id: ConnecAudience; label: string; description: string; icon: LucideIcon }> = [
  { id: 'everyone', label: 'Mostrar para todos', description: 'Qualquer estudante que veja seus Connecs.', icon: Globe2 },
  { id: 'only', label: 'Somente alguém', description: 'Só as pessoas que você escolher.', icon: UserCheck },
  { id: 'except', label: 'Todos exceto…', description: 'Todo mundo, menos quem você escolher.', icon: UserX },
];

interface AudiencePickerProps {
  value: ConnecPrivacy;
  onChange: (value: ConnecPrivacy) => void;
  error?: string | null;
  disabled?: boolean;
}

/** Escolha de quem vê um Connec. Vale só para o Connec em edição, nunca como regra geral. */
export function AudiencePicker({ value, onChange, error, disabled }: AudiencePickerProps) {
  const selected = new Set(value.userIds);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...value, userIds: [...next] });
  };

  const choosing = value.audience !== 'everyone';

  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-[0.8125rem] font-semibold text-fog">Quem pode ver</legend>
      <div className="grid gap-1.5" role="radiogroup" aria-label="Quem pode ver">
        {OPTIONS.map(({ id, label, description, icon: Icon }) => {
          const active = value.audience === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              // Trocar de opção limpa a lista: quem podia ver e quem não podia são listas opostas
              onClick={() => !active && onChange({ audience: id, userIds: [] })}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                active ? 'border-brand-400 bg-brand/15' : 'border-line bg-ink-850 hover:border-white/25',
              )}
            >
              <Icon className={cn('size-[1.125rem] shrink-0', active ? 'text-brand-300' : 'text-mist')} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">{label}</span>
                <span className="block text-xs leading-snug text-mist">{description}</span>
              </span>
              <span
                className={cn('grid size-[1.125rem] shrink-0 place-items-center rounded-full border-2', active ? 'border-brand-400' : 'border-white/25')}
                aria-hidden
              >
                {active && <span className="size-2 rounded-full bg-brand-400" />}
              </span>
            </button>
          );
        })}
      </div>

      {choosing && (
        <div className="mt-3 animate-fade-in rounded-xl border border-line bg-ink-850 p-2">
          <div className="flex items-center justify-between gap-3 px-1.5 pb-2 pt-1">
            <p className="text-[0.8125rem] font-semibold text-white">
              {value.audience === 'only' ? 'Quem pode ver' : 'Quem não pode ver'}
            </p>
            <span className="text-xs text-mist">
              {selected.size} {plural(selected.size, 'selecionada', 'selecionadas')}
            </span>
          </div>
          <PeoplePicker selected={value.userIds} onToggle={toggle} />
        </div>
      )}

      {error && (
        <p className="mt-2 text-[0.8125rem] text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
