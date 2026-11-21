import { useState, type FormEvent } from 'react';
import { Check, Plus } from 'lucide-react';
import { ConnecFace } from '@/components/connecs/ConnecFace';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ME, useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import type { ID } from '@/types';
import { cn } from '@/utils/cn';
import { HIGHLIGHT_NAME_MAX, highlightCover, visibleHighlightConnecs } from '@/utils/connecs';
import { plural } from '@/utils/format';

interface HighlightPickerModalProps {
  connecId: ID | null;
  onClose: () => void;
}

/** "Salvar em destaque": marca em quais destaques do perfil o Connec fica, ou cria um novo. */
export function HighlightPickerModal({ connecId, onClose }: HighlightPickerModalProps) {
  const { state, createHighlight, setConnecInHighlight } = useApp();
  const { success } = useToast();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!connecId) return null;
  const mine = state.highlights.filter((highlight) => highlight.ownerId === ME);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const highlight = await createHighlight({ name, cover: null, connecIds: [connecId] });
      success(`Salvo no destaque “${highlight.name}”.`);
      setCreating(false);
      setName('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível criar o destaque.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Salvar em destaque"
      description="Nos destaques, o Connec fica no seu perfil mesmo depois das 24 horas."
      footer={<Button onClick={onClose}>Concluir</Button>}
    >
      <ul className="space-y-1">
        {mine.map((highlight) => {
          const included = highlight.items.some((item) => item.connecId === connecId);
          const visible = visibleHighlightConnecs(highlight, state.connecs, ME);
          const cover = highlightCover(highlight, visible);
          return (
            <li key={highlight.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={included}
                onClick={() => setConnecInHighlight(highlight.id, connecId, !included)}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.05]"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-line">
                  <ConnecFace connec={cover.connec} imageUrl={cover.url} textSize="xs" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] font-semibold text-white">{highlight.name}</span>
                  <span className="block text-xs text-mist">
                    {highlight.items.length} {plural(highlight.items.length, 'Connec', 'Connecs')}
                  </span>
                </span>
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-lg border transition-colors',
                    included ? 'theme-dark border-brand-400 bg-brand-500 text-white' : 'border-white/25 text-transparent',
                  )}
                  aria-hidden
                >
                  <Check className="size-4" strokeWidth={3} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {mine.length === 0 && !creating && <p className="mb-2 text-sm text-fog">Você ainda não tem destaques. Crie o primeiro com este Connec.</p>}

      {creating ? (
        <form onSubmit={create} className="mt-3 flex gap-2">
          <input
            data-autofocus
            value={name}
            maxLength={HIGHLIGHT_NAME_MAX}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder="Nome do destaque, ex.: Faculdade"
            aria-label="Nome do novo destaque"
            aria-invalid={Boolean(error)}
            className="field h-10 flex-1"
          />
          <Button type="submit" loading={saving}>Criar</Button>
        </form>
      ) : (
        <Button variant="secondary" className="mt-3 w-full" icon={<Plus className="size-4" aria-hidden />} onClick={() => setCreating(true)}>
          Novo destaque
        </Button>
      )}
      {error && (
        <p className="mt-2 text-[0.8125rem] text-danger" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
