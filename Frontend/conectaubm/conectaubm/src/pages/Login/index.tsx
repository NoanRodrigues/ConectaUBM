import { useMemo, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { AvatarStack } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field } from '@/components/ui/Form';
import { Logo } from '@/components/ui/Logo';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { COURSES, PERIODS } from '@/data/catalog';
import { buildMockUsers } from '@/data/mockUsers';
import { requestPasswordReset } from '@/services/authService';
import { firstName } from '@/utils/format';
import { Constellation } from './Constellation';

type Mode = 'login' | 'signup';

interface FormState {
  name: string;
  email: string;
  course: string;
  period: string;
  password: string;
  confirm: string;
}

type Errors = Partial<Record<keyof FormState | 'terms', string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Entrar pede só e-mail e senha; nome, curso e período são informados uma vez, no cadastro. */
function validate(form: FormState, mode: Mode, terms: boolean): Errors {
  const errors: Errors = {};
  if (!form.email.trim()) errors.email = 'Informe seu e-mail institucional ou o e-mail cadastrado.';
  else if (!EMAIL.test(form.email.trim())) errors.email = 'Este e-mail não parece válido. Exemplo: nome@ubm.br';
  if (mode === 'login') {
    if (!form.password) errors.password = 'Informe sua senha.';
    return errors;
  }
  if (form.name.trim().length < 3) errors.name = 'Informe seu nome completo.';
  if (!form.course) errors.course = 'Selecione seu curso.';
  if (form.password.length < 6) errors.password = 'A senha precisa ter pelo menos 6 caracteres.';
  if (form.confirm !== form.password) errors.confirm = 'As senhas não são iguais.';
  if (!terms) errors.terms = 'Aceite as diretrizes da comunidade para criar a conta.';
  return errors;
}

export function LoginPage() {
  const { isAuthenticated, login, register } = useApp();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<FormState>({ name: '', email: '', course: '', period: '', password: '', confirm: '' });
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [keepConnected, setKeepConnected] = useState(true);
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Só ilustração (avatares desenhados), antes de existir sessão: não são contas reais.
  const illustration = useMemo(() => Object.values(buildMockUsers()).slice(3, 7), []);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const errors = validate(form, mode, terms);
  const show = (field: keyof FormState) => (submitted || touched[field] ? errors[field] : undefined);

  const set = (field: keyof FormState) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setServerError(null);
  };
  const blur = (field: keyof FormState) => () => setTouched((current) => ({ ...current, [field]: true }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    setLoading(true);
    setServerError(null);
    try {
      if (mode === 'signup') {
        await register({
          name: form.name,
          email: form.email,
          course: form.course,
          period: form.period ? Number(form.period) : null,
          password: form.password,
          keepConnected,
        });
        success(`Conta criada. Boas-vindas, ${firstName(form.name)}!`);
      } else {
        const name = await login({ email: form.email, password: form.password, keepConnected });
        success(`Que bom ter você aqui, ${firstName(name)}!`);
      }
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/', { replace: true });
    } catch (reason) {
      setServerError(reason instanceof Error ? reason.message : 'Não foi possível entrar agora. Tente de novo em instantes.');
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((current) => (current === 'login' ? 'signup' : 'login'));
    setSubmitted(false);
    setServerError(null);
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.08fr_1fr]">
      {/* Painel da comunidade (desktop) */}
      <section className="theme-dark theme-navy navy-surface relative hidden overflow-hidden lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(60% 50% at 50% 42%, rgba(28,83,144,0.6), transparent 70%)' }}
          aria-hidden
        />
        <header className="relative p-10 pb-0">
          <Logo />
        </header>
        <Constellation className="relative mx-auto my-6 w-full max-w-[38rem] flex-1" />
        <footer className="relative p-10 pt-0">
          <h1 className="max-w-md text-balance text-[2.6rem] font-bold leading-[1.05] text-white">
            Conectando pessoas.
            <br />
            <span className="text-sun">Aproximando futuros.</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-fog">
            A rede dos estudantes da UBM. Conecte-se com alunos de outros cursos e períodos.
          </p>
        </footer>
      </section>

      {/* Formulário */}
      <main className="flex flex-col justify-center px-5 py-8 sm:px-10">
        <div className="mx-auto w-full max-w-[26rem]">
          <div className="theme-dark theme-navy navy-surface relative mb-8 overflow-hidden rounded-3xl p-6 pb-14 lg:hidden">
            <div className="pointer-events-none absolute -bottom-14 -right-10 h-24 w-60 -rotate-12 rounded-full bg-sun/90 blur-[2px]" aria-hidden />
            <Logo />
            <p className="relative mt-4 font-display text-xl font-bold leading-snug text-white">
              Conectando pessoas.
              <br />
              <span className="text-sun">Aproximando futuros.</span>
            </p>
          </div>

          <h2 className="text-[1.75rem] font-bold leading-tight text-white">{mode === 'login' ? 'Entre na sua comunidade' : 'Crie sua conta'}</h2>
          <div className="mt-2.5 flex items-center gap-2.5 text-sm text-fog">
            <AvatarStack users={illustration} max={4} />
            <span>Estudantes de todos os cursos da UBM, num lugar só</span>
          </div>

          <form onSubmit={submit} noValidate className="mt-7 space-y-4">
            {serverError && (
              <div className="flex animate-fade-in items-start gap-2.5 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-3 text-sm text-white" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                {serverError}
              </div>
            )}

            {mode === 'signup' && (
              <Field label="Nome completo" error={show('name')} className="animate-fade-in">
                {(props) => (
                  <input
                    {...props}
                    className="field"
                    value={form.name}
                    autoComplete="name"
                    placeholder="Como você quer aparecer para os colegas"
                    disabled={loading}
                    onChange={(event) => set('name')(event.target.value)}
                    onBlur={blur('name')}
                  />
                )}
              </Field>
            )}

            <Field label="E-mail institucional ou cadastrado" error={show('email')}>
              {(props) => (
                <input
                  {...props}
                  type="email"
                  inputMode="email"
                  className="field"
                  value={form.email}
                  autoComplete="email"
                  placeholder="nome@ubm.br"
                  disabled={loading}
                  onChange={(event) => set('email')(event.target.value)}
                  onBlur={blur('email')}
                />
              )}
            </Field>

            {mode === 'signup' && (
              <div className="grid animate-fade-in gap-4 sm:grid-cols-[1fr_10.5rem]">
                <Field label="Curso" error={show('course')}>
                  {(props) => (
                    <select
                      {...props}
                      className="field"
                      value={form.course}
                      disabled={loading}
                      onChange={(event) => set('course')(event.target.value)}
                      onBlur={blur('course')}
                    >
                      <option value="" disabled>
                        Selecione seu curso
                      </option>
                      {COURSES.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="Período" hint="opcional">
                  {(props) => (
                    <select {...props} className="field" value={form.period} disabled={loading} onChange={(event) => set('period')(event.target.value)}>
                      <option value="">Não informar</option>
                      {PERIODS.map((period) => (
                        <option key={period} value={period}>
                          {period}º período
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>
            )}

            <Field label="Senha" error={show('password')}>
              {(props) => (
                <div className="relative">
                  <input
                    {...props}
                    type={showPassword ? 'text' : 'password'}
                    className="field pr-12"
                    value={form.password}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'login' ? 'Sua senha' : 'Mínimo de 6 caracteres'}
                    disabled={loading}
                    onChange={(event) => set('password')(event.target.value)}
                    onBlur={blur('password')}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-mist transition-colors hover:bg-white/10 hover:text-white"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="size-[1.125rem]" aria-hidden /> : <Eye className="size-[1.125rem]" aria-hidden />}
                  </button>
                </div>
              )}
            </Field>

            {mode === 'signup' && (
              <Field label="Confirmar senha" error={show('confirm')} className="animate-fade-in">
                {(props) => (
                  <input
                    {...props}
                    type={showPassword ? 'text' : 'password'}
                    className="field"
                    value={form.confirm}
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    disabled={loading}
                    onChange={(event) => set('confirm')(event.target.value)}
                    onBlur={blur('confirm')}
                  />
                )}
              </Field>
            )}

            {mode === 'login' ? (
              <div className="flex items-center justify-between gap-3 pt-1">
                <Checkbox checked={keepConnected} onChange={setKeepConnected}>
                  Manter conectado
                </Checkbox>
                <button type="button" className="text-sm font-semibold text-brand-300 hover:underline" onClick={() => setForgotOpen(true)}>
                  Esqueci a senha
                </button>
              </div>
            ) : (
              <div className="pt-1">
                <Checkbox checked={terms} onChange={setTerms}>
                  Li e aceito as diretrizes da comunidade
                </Checkbox>
                {submitted && errors.terms && (
                  <p className="mt-1.5 text-[0.8125rem] text-danger" role="alert">
                    {errors.terms}
                  </p>
                )}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {loading ? (mode === 'login' ? 'Entrando' : 'Criando conta') : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-fog">
            {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
            <button type="button" className="font-semibold text-brand-300 hover:underline" onClick={switchMode} disabled={loading}>
              {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>

        </div>
      </main>

      {forgotOpen && <ForgotPasswordModal initialEmail={form.email} onClose={() => setForgotOpen(false)} />}
    </div>
  );
}

function ForgotPasswordModal({ initialEmail, onClose }: { initialEmail: string; onClose: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError('Informe um e-mail válido para receber o link.');
      return;
    }
    setSending(true);
    try {
      setSentTo(await requestPasswordReset(email));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível enviar agora.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={sentTo ? 'Confira seu e-mail' : 'Redefinir senha'}
      size="sm"
      dismissible={!sending}
      footer={
        sentTo ? (
          <Button onClick={onClose} data-autofocus>
            Voltar para o login
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={sending}>
              Cancelar
            </Button>
            <Button type="submit" form="forgot-form" loading={sending}>
              Enviar link
            </Button>
          </>
        )
      }
    >
      {sentTo ? (
        <div className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-fog">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-online" aria-hidden />
          <p>
            Se existir uma conta para <strong className="font-semibold text-white">{sentTo}</strong>, o link para criar uma nova senha chega em
            alguns minutos.
          </p>
        </div>
      ) : (
        <form id="forgot-form" onSubmit={submit} noValidate>
          <p className="mb-4 text-[0.9375rem] leading-relaxed text-fog">Enviamos um link para você criar uma nova senha.</p>
          <Field label="E-mail da conta" error={error}>
            {(props) => (
              <input
                {...props}
                data-autofocus
                type="email"
                className="field"
                value={email}
                placeholder="nome@ubm.br"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(undefined);
                }}
              />
            )}
          </Field>
        </form>
      )}
    </Modal>
  );
}
