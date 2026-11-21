import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Check, ImagePlus, Sparkles, Trash2 } from 'lucide-react';
import { ConnecFace } from '@/components/connecs/ConnecFace';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Chip } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { ME, useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { ServiceError } from '@/services/api';
import { imageFileToCover } from '@/services/connecService';
import type { Highlight, HighlightCover, ID } from '@/types';
import { cn } from '@/utils/cn';
import { HIGHLIGHT_NAME_MAX, highlightCover, historyOf } from '@/utils/connecs';
import { plural } from '@/utils/format';

const NAME_IDEAS = ['Estudo Java', 'Família', 'Amigos', 'Faculdade', 'Viagens', 'Projetos'];

type CoverMode = 'auto' | 'connec' | 'upload';

interface HighlightEditorModalProps {
  /** Destaque em edição. Sem ele, a janela cria um novo. */
  highlight?: Highlight | null;
  onClose: () => void;
}

/** Criar ou editar um destaque: nome, capa e quais Connecs do histórico ficam nele. */
export function HighlightEditorModal({ highlight, onClose }: HighlightEditorModalProps) {
  const { state, createHighlight, updateHighlight, deleteHighlight } = useApp();
  const { success, toast } = useToast();
  const history = useMemo(() => historyOf(state.connecs, ME), [state.connecs]);
  const editing = Boolean(highlight);

  const [name, setName] = useState(highlight?.name ?? '');
  const [selected, setSelected] = useState<ID[]>(() => highlight?.items.map((item) => item.connecId) ?? []);
  const [mode, setMode] = useState<CoverMode>(highlight?.cover?.kind === 'upload' ? 'upload' : highlight?.cover?.kind === 'connec' ? 'connec' : 'auto');
  const [coverConnecId, setCoverConnecId] = useState<ID | null>(highlight?.cover?.kind === 'connec' ? highlight.cover.connecId : null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(highlight?.cover?.kind === 'upload' ? highlight.cover.url : null);
  const [processing, setProcessing] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedSet = new Set(selected);
  const chosen = history.filter((connec) => selectedSet.has(connec.id));

  const cover: HighlightCover | null =
    mode === 'upload' && uploadUrl
      ? { kind: 'upload', url: uploadUrl }
      : mode === 'connec' && coverConnecId && selectedSet.has(coverConnecId)
        ? { kind: 'connec', connecId: coverConnecId }
        : null;

  // Prévia da capa com a mesma regra do perfil (sem capa: o último Connec adicionado)
  const previewItems = selected.map((connecId, order) => ({
    connecId,
    addedAt: highlight?.items.find((item) => item.connecId === connecId)?.addedAt ?? new Date(Date.now() + order).toISOString(),
  }));
  const byId = new Map(history.map((connec) => [connec.id, connec]));
  const previewVisible = [...previewItems].sort((a, b) => a.addedAt.localeCompare(b.addedAt)).flatMap((item) => byId.get(item.connecId) ?? []);
  const preview = highlightCover(
    { id: 'preview', ownerId: ME, name, cover, items: previewItems, createdAt: '', updatedAt: '' },
    previewVisible,
  );

  const toggle = (id: ID) => {
    setProblem(null);
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  };

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setProcessing(true);
    try {
      setUploadUrl(await imageFileToCover(file));
      setMode('upload');
    } catch (reason) {
      setProblem(reason instanceof Error ? reason.message : 'Não foi possível usar esta imagem.');
    } finally {
      setProcessing(false);
    }
  };

  const save = async () => {
    if (selected.length === 0) {
      setProblem('Escolha pelo menos um Connec para o destaque.');
      return;
    }
    setSaving(true);
    try {
      const input = { name, cover, connecIds: selected };
      if (highlight) {
        await updateHighlight(highlight.id, input);
        success('Destaque atualizado.');
      } else {
        const created = await createHighlight(input);
        success(`Destaque “${created.name}” criado no seu perfil.`);
      }
      onClose();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Não foi possível salvar.';
      if (reason instanceof ServiceError && reason.field === 'name') setNameError(message);
      else setProblem(message);
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={editing ? 'Editar destaque' : 'Novo destaque'}
        description="Os Connecs do destaque ficam no seu perfil sem prazo para sair."
        size="lg"
        footer={
          <>
            {editing && (
              <Button variant="danger" className="mr-auto" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => setConfirmDelete(true)}>
                Excluir
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving} disabled={processing}>
              {editing ? 'Salvar' : 'Criar destaque'}
            </Button>
          </>
        }
      >
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={onPick} />

        <div className="flex items-start gap-4">
          <span className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-line bg-ink-950">
            <ConnecFace connec={preview.connec} imageUrl={preview.url} textSize="xs" />
            {processing && (
              <span className="absolute inset-0 grid place-items-center bg-night/50 text-paper">
                <Spinner className="size-5" />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <label htmlFor="highlight-name" className="text-[0.8125rem] font-semibold text-fog">
                Nome
              </label>
              <span className="text-xs tabular-nums text-mist">
                {name.length}/{HIGHLIGHT_NAME_MAX}
              </span>
            </div>
            <input
              id="highlight-name"
              data-autofocus
              value={name}
              maxLength={HIGHLIGHT_NAME_MAX}
              aria-invalid={Boolean(nameError)}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(null);
              }}
              placeholder="Ex.: Faculdade"
              className="field"
            />
            {nameError && (
              <p className="mt-1.5 text-[0.8125rem] text-danger" role="alert">
                {nameError}
              </p>
            )}
            <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto sm:flex-wrap">
              {NAME_IDEAS.map((idea) => (
                <Chip key={idea} size="sm" active={name === idea} onClick={() => setName(idea)}>
                  {idea}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-[0.8125rem] font-semibold text-fog">Capa</legend>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Capa do destaque">
            {(
              [
                ['auto', 'Automática', 'O Connec adicionado por último', Sparkles],
                ['connec', 'Um dos Connecs', 'Escolha abaixo qual', Check],
                ['upload', 'Enviar imagem', 'Uma foto do dispositivo', ImagePlus],
              ] as const
            ).map(([id, label, description, Icon]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                onClick={() => {
                  if (id === 'upload' && !uploadUrl) fileInput.current?.click();
                  else setMode(id);
                  if (id === 'connec' && !coverConnecId) setCoverConnecId(chosen[0]?.id ?? null);
                }}
                className={cn(
                  'flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors',
                  mode === id ? 'border-brand-400 bg-brand/15' : 'border-line bg-ink-850 hover:border-white/25',
                )}
              >
                <Icon className={cn('mt-0.5 size-[1.125rem] shrink-0', mode === id ? 'text-brand-300' : 'text-mist')} aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-white">{label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-mist">{description}</span>
                </span>
              </button>
            ))}
          </div>

          {mode === 'connec' && (
            <div className="mt-3">
              {chosen.length === 0 ? (
                <p className="text-sm text-mist">Marque os Connecs do destaque para escolher a capa entre eles.</p>
              ) : (
                <ul className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Connec da capa">
                  {chosen.map((connec) => (
                    <li key={connec.id} className="shrink-0">
                      <button
                        type="button"
                        aria-pressed={coverConnecId === connec.id}
                        aria-label={`Usar como capa: ${connec.text || 'Connec com foto'}`}
                        onClick={() => setCoverConnecId(connec.id)}
                        className={cn(
                          'relative block size-14 overflow-hidden rounded-xl border-2 transition-colors',
                          coverConnecId === connec.id ? 'border-sun' : 'border-transparent',
                        )}
                      >
                        <ConnecFace connec={connec} textSize="xs" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {mode === 'upload' && uploadUrl && (
            <Button variant="secondary" size="sm" className="mt-3" icon={<ImagePlus className="size-4" aria-hidden />} onClick={() => fileInput.current?.click()}>
              Trocar imagem
            </Button>
          )}
        </fieldset>

        <section className="mt-5" aria-labelledby="highlight-items">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 id="highlight-items" className="text-[0.8125rem] font-semibold text-fog">
              Connecs do destaque
            </h3>
            <span className="text-xs text-mist">
              {selected.length} {plural(selected.length, 'selecionado', 'selecionados')}
            </span>
          </div>
          {history.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-fog">
              Você ainda não publicou Connecs. Publique um no Início e depois salve aqui.
            </p>
          ) : (
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {history.map((connec) => {
                const checked = selectedSet.has(connec.id);
                return (
                  <li key={connec.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={`${connec.text || 'Connec com foto'}, ${new Date(connec.createdAt).toLocaleDateString('pt-BR')}`}
                      onClick={() => toggle(connec.id)}
                      className="relative block aspect-square w-full overflow-hidden rounded-xl border border-line"
                    >
                      <ConnecFace connec={connec} textSize="xs" />
                      <span className={cn('absolute inset-0 transition-colors', checked ? 'bg-night/25' : 'bg-transparent')} aria-hidden />
                      {checked && <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-[3px] ring-inset ring-sun" aria-hidden />}
                      <span
                        className={cn(
                          'absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full border-2 transition-colors',
                          checked ? 'border-sun bg-sun text-night' : 'border-paper/80 bg-night/30 text-transparent',
                        )}
                        aria-hidden
                      >
                        <Check className="size-3" strokeWidth={3.5} />
                      </span>
                      <span className="absolute bottom-1 left-1 rounded bg-night/60 px-1 text-[0.625rem] font-semibold text-paper">
                        {new Date(connec.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {problem && (
          <p className="mt-3 text-[0.8125rem] text-danger" role="alert">
            {problem}
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title={`Excluir o destaque “${highlight?.name ?? ''}”?`}
        description="O destaque sai do seu perfil. Os Connecs continuam no seu histórico."
        confirmLabel="Excluir destaque"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!highlight) return;
          deleteHighlight(highlight.id);
          toast('Destaque excluído. Os Connecs continuam no seu histórico.');
          onClose();
        }}
      />
    </>
  );
}
