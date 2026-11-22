import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Camera, ImageUp, Plus, RotateCcw } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip, Field } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { COURSES, INTERESTS, PERIODS } from '@/data/catalog';
import { DEFAULT_COVER } from '@/data/mockMedia';
import { imageFileToDataUrl } from '@/services/mediaService';
import { AVATAR_CHOICES, illustratedAvatar } from '@/utils/avatar';
import { cn } from '@/utils/cn';

const BIO_MAX = 160;
const MAX_INTERESTS = 8;

interface Errors {
  name?: string;
  course?: string;
  bio?: string;
  interests?: string;
}

/** Edição de perfil: as alterações valem na hora em toda a interface (feed, chat, comentários…). */
export function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { me, updateProfile } = useApp();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState(me.name);
  const [course, setCourse] = useState(me.course);
  const [period, setPeriod] = useState<number | null>(me.period);
  const [bio, setBio] = useState(me.bio);
  const [interests, setInterests] = useState<string[]>(me.interests);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(me.avatarUrl);
  const [avatarSeed, setAvatarSeed] = useState(me.avatarSeed);
  const [coverUrl, setCoverUrl] = useState<string | null>(me.coverUrl);
  const [customInterest, setCustomInterest] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [showAvatars, setShowAvatars] = useState(false);

  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const pickImage = (kind: 'avatar' | 'cover') => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (kind === 'avatar') setAvatarUrl(await imageFileToDataUrl(file, 480, 0.85));
      else setCoverUrl(await imageFileToDataUrl(file, 1600, 0.8));
    } catch (reason) {
      toastError(reason instanceof Error ? reason.message : 'Não foi possível usar esta imagem.');
    }
  };

  const toggleInterest = (interest: string) => {
    const selected = interests.includes(interest);
    if (!selected && interests.length >= MAX_INTERESTS) {
      setErrors((current) => ({ ...current, interests: `Escolha até ${MAX_INTERESTS} interesses. Remova um para adicionar outro.` }));
      return;
    }
    setErrors((current) => ({ ...current, interests: undefined }));
    setInterests(selected ? interests.filter((item) => item !== interest) : [...interests, interest]);
  };

  const addCustomInterest = () => {
    const value = customInterest.trim().replace(/\s+/g, ' ');
    if (value.length < 2) return;
    const existing = [...INTERESTS, ...interests].find((item) => item.toLowerCase() === value.toLowerCase());
    const label = existing ?? value.charAt(0).toUpperCase() + value.slice(1);
    if (!interests.includes(label)) toggleInterest(label);
    setCustomInterest('');
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (name.trim().length < 3) next.name = 'Informe seu nome com pelo menos 3 letras.';
    if (!course) next.course = 'Selecione seu curso.';
    if (bio.length > BIO_MAX) next.bio = `A biografia passa de ${BIO_MAX} caracteres.`;
    if (interests.length === 0) next.interests = 'Escolha ao menos um interesse para que colegas encontrem você.';
    return next;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim().replace(/\s+/g, ' '), course, period, bio: bio.trim(), interests, avatarUrl, avatarSeed, coverUrl });
      success('Alterações salvas.');
      onClose();
    } catch (reason) {
      toastError(reason instanceof Error ? reason.message : 'Não foi possível salvar agora. Tente de novo.');
      setSaving(false);
    }
  };

  const extraInterests = interests.filter((item) => !(INTERESTS as readonly string[]).includes(item));

  return (
    <Modal
      open
      onClose={onClose}
      title="Editar perfil"
      size="lg"
      dismissible={!saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="edit-profile-form" loading={saving}>
            {saving ? 'Salvando' : 'Salvar alterações'}
          </Button>
        </>
      }
    >
      <form id="edit-profile-form" onSubmit={submit} noValidate className="space-y-5">
        <input ref={avatarInput} type="file" accept="image/*" hidden onChange={pickImage('avatar')} />
        <input ref={coverInput} type="file" accept="image/*" hidden onChange={pickImage('cover')} />

        {/* Prévia da capa e da foto */}
        <div>
          <div className="theme-dark relative h-32 overflow-hidden rounded-2xl border border-line sm:h-40">
            <img src={coverUrl ?? DEFAULT_COVER} alt="Prévia da foto de capa" className="size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" aria-hidden />
            <div className="absolute bottom-2.5 right-2.5 flex gap-2">
              {coverUrl && (
                <Button size="sm" variant="secondary" className="bg-ink-950/70 backdrop-blur" icon={<RotateCcw className="size-3.5" aria-hidden />} onClick={() => setCoverUrl(null)}>
                  Capa padrão
                </Button>
              )}
              <Button size="sm" variant="secondary" className="bg-ink-950/70 backdrop-blur" icon={<ImageUp className="size-3.5" aria-hidden />} onClick={() => coverInput.current?.click()}>
                Alterar capa
              </Button>
            </div>
          </div>
          <div className="-mt-9 flex items-end gap-4 px-4">
            <div className="relative">
              <Avatar user={{ name, avatarUrl, avatarSeed, online: false }} size="xl" className="rounded-squircle ring-4 ring-ink-800" />
              <button
                type="button"
                aria-label="Enviar foto de perfil"
                className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full theme-dark bg-brand text-white ring-4 ring-ink-800 transition-colors hover:bg-brand-500"
                onClick={() => avatarInput.current?.click()}
              >
                <Camera className="size-4" aria-hidden />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              <Button size="sm" variant="secondary" onClick={() => avatarInput.current?.click()}>
                Alterar foto
              </Button>
              <Button size="sm" variant="ghost" aria-expanded={showAvatars} onClick={() => setShowAvatars((value) => !value)}>
                Usar avatar ilustrado
              </Button>
            </div>
          </div>
          {showAvatars && (
            <div className="mt-3 animate-fade-in rounded-2xl border border-line bg-ink-850 p-3">
              <p className="mb-2.5 text-[0.8125rem] text-mist">Sem foto por enquanto? Escolha um avatar.</p>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                {AVATAR_CHOICES.map((seed) => {
                  const selected = !avatarUrl && avatarSeed === seed;
                  return (
                    <button
                      key={seed}
                      type="button"
                      aria-label="Escolher este avatar"
                      aria-pressed={selected}
                      className={cn(
                        'aspect-square overflow-hidden rounded-squircle transition-all hover:scale-105',
                        selected ? 'ring-2 ring-brand-300 ring-offset-2 ring-offset-ink-850' : 'opacity-80 hover:opacity-100',
                      )}
                      onClick={() => {
                        setAvatarSeed(seed);
                        setAvatarUrl(null);
                      }}
                    >
                      <img src={illustratedAvatar(seed)} alt="" className="size-full" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Field label="Nome completo" error={errors.name}>
          {(props) => (
            <input
              {...props}
              className="field"
              value={name}
              maxLength={60}
              autoComplete="name"
              onChange={(event) => {
                setName(event.target.value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
          <Field label="Curso" error={errors.course}>
            {(props) => (
              <select {...props} className="field" value={course} onChange={(event) => setCourse(event.target.value)}>
                {!(COURSES as readonly string[]).includes(course) && <option value={course}>{course}</option>}
                {COURSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Período" hint="opcional">
            {(props) => (
              <select
                {...props}
                className="field"
                value={period ?? ''}
                onChange={(event) => setPeriod(event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">Prefiro não informar</option>
                {PERIODS.map((item) => (
                  <option key={item} value={item}>
                    {item}º período
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <Field
          label="Biografia"
          error={errors.bio}
          footer={
            <p className={cn('mt-1.5 text-right text-xs tabular-nums', bio.length > BIO_MAX ? 'text-danger' : 'text-mist')}>
              {bio.length}/{BIO_MAX}
            </p>
          }
        >
          {(props) => (
            <textarea
              {...props}
              className="field min-h-[5.5rem] resize-y"
              rows={3}
              value={bio}
              placeholder="Conte em uma ou duas frases o que você faz e o que procura por aqui."
              onChange={(event) => {
                setBio(event.target.value);
                setErrors((current) => ({ ...current, bio: undefined }));
              }}
            />
          )}
        </Field>

        <fieldset>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <legend className="text-[0.8125rem] font-semibold text-fog">Interesses</legend>
            <span className="text-xs tabular-nums text-mist">
              {interests.length} de {MAX_INTERESTS}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...extraInterests, ...INTERESTS].map((interest) => (
              <Chip key={interest} active={interests.includes(interest)} onClick={() => toggleInterest(interest)}>
                {interest}
              </Chip>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="field h-10 py-0"
              value={customInterest}
              maxLength={24}
              placeholder="Outro interesse"
              aria-label="Adicionar outro interesse"
              onChange={(event) => setCustomInterest(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addCustomInterest();
                }
              }}
            />
            <Button variant="secondary" icon={<Plus className="size-4" aria-hidden />} onClick={addCustomInterest} disabled={customInterest.trim().length < 2}>
              Adicionar
            </Button>
          </div>
          {errors.interests && (
            <p className="mt-2 text-[0.8125rem] text-danger" role="alert">
              {errors.interests}
            </p>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
