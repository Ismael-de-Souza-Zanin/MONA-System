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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen bg-[#f7f6f3] px-4 py-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl items-center">
        <BrandLogo size={52} />
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="pt-4">
          <span className="fv-pill bg-brand-50 text-brand-900">
            Plataforma para assistentes executivas
          </span>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-ink-900 brand-font md:text-5xl">
            Organize operações. Entregue resultados.{' '}
            <span className="text-brand-800">De onde estiver.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base text-ink-500">
            Centralize clientes, tarefas, documentos e comunicações em um só lugar e ganhe tempo
            para o que realmente importa.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { title: 'Segurança de ponta', text: 'Dados protegidos e acesso controlado por perfil.' },
              { title: 'Tudo organizado', text: 'Clientes, SOPs, agenda e financeiro no mesmo fluxo.' },
              { title: 'Acesso de onde estiver', text: 'Conta principal e compartilhadas com permissões.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-ink-100 bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="fv-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-ink-900 app-font">Bem-vinda de volta</h2>
          <p className="mt-1 text-sm text-ink-500">Faça login para acessar sua conta</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              <span className="relative z-10 bg-white px-2">ou</span>
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

          <div className="mt-6 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-xs text-emerald-800">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            Acesso seguro. Seus dados ficam protegidos com autenticação e permissões por perfil.
          </div>
        </section>
      </div>
    </div>
  )
}
