import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Headphones, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../shared/auth/AuthContext'
import { BrandLogo, Button, ErrorAlert, Input, LoadingSpinner } from '../../shared/ui'

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const fakeApi = import.meta.env.VITE_FAKE_API === '1'
  const [email, setEmail] = useState(fakeApi ? 'ju@fattovirtual.com' : '')
  const [password, setPassword] = useState(fakeApi ? 'Admin123!' : '')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: () => navigate(from, { replace: true }),
    onError: (err: Error) => setError(err.message),
  })

  if (isLoading) return <LoadingSpinner />
  if (isAuthenticated) return <Navigate to="/" replace />

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate()
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 lg:px-10">
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 mona-orb mona-orb--purple" />
      <div className="pointer-events-none absolute right-0 top-24 h-64 w-64 mona-orb mona-orb--pink" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 mona-orb mona-orb--orange" />

      <div className="relative mx-auto flex max-w-6xl items-center gap-3">
        <BrandLogo size={48} showWordmark title="MONA" subtitle="Organiza. Opera. Avança." />
      </div>

      <div className="relative mx-auto mt-10 grid max-w-6xl items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between overflow-hidden rounded-[32px] bg-[#0F0A1A] p-8 text-white shadow-[0_24px_60px_rgba(15,10,26,0.28)] md:p-10">
          <div>
            <BrandLogo variant="wordmark" size={86} className="max-w-[min(100%,420px)]" />
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
              Organiza. Opera. Avança.
            </p>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-tight brand-font md:text-5xl">
              Mais fluida para um dia mais seu.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 md:text-base">
              Centralize clientes, tarefas, documentos e comunicações. A identidade da MONA, agora no ritmo da operação.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { title: 'Organização', text: 'Clientes, SOPs e agenda no mesmo fluxo.' },
              { title: 'Operação', text: 'Fila do dia sem engessar o seu jeito de trabalhar.' },
              { title: 'Evolução', text: 'Acesso de onde estiver, com permissões por perfil.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/65">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mona-card flex flex-col justify-center rounded-[32px] p-6 md:p-8">
          <span className="fv-pill bg-brand-50 text-brand-900">Plataforma para assistentes executivas</span>
          <h2 className="mt-4 text-2xl font-semibold text-ink-900 app-font">Bem-vinda de volta</h2>
          <p className="mt-1 text-sm text-ink-500">Faça login para acessar sua conta</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {fakeApi && (
              <div className="rounded-2xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-900">
                Modo front-only: API fake, sem Docker e sem banco. Entre com a conta pré-preenchida.
              </div>
            )}
            {error && <ErrorAlert message={error} />}

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-[38px] text-ink-500" size={16} />
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-[38px] text-ink-500" size={16} />
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pl-10 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[38px] text-ink-500 hover:text-ink-700"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-ink-700">
                <input type="checkbox" className="rounded border-ink-300 text-brand-800" />
                Lembrar de mim
              </label>
              <span className="font-medium text-brand-800">Esqueci minha senha</span>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Entrando...' : 'Entrar'}
              <ArrowRight size={16} />
            </Button>

            <div className="relative py-1 text-center text-xs text-ink-500">
              <span className="relative z-10 bg-[var(--mona-color-surface)] px-2">ou</span>
              <div className="absolute inset-x-0 top-1/2 h-px bg-ink-100" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
            >
              <Headphones size={16} />
              Preciso de ajuda para acessar
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-2xl bg-brand-50 px-3 py-3 text-xs text-brand-900">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            Acesso seguro. Seus dados ficam protegidos com autenticação e permissões por perfil.
          </div>
        </section>
      </div>
    </div>
  )
}
