import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../shared/auth/AuthContext'
import { BrandLogo, Button, ErrorAlert, Input } from '../../shared/ui'

export function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [localError, setLocalError] = useState('')

  const mutation = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setLocalError('')
    if (newPassword !== confirmation) {
      setLocalError('A confirmação não corresponde à nova senha.')
      return
    }
    mutation.mutate()
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 mona-orb mona-orb--purple" />
      <div className="pointer-events-none absolute -right-20 bottom-4 h-72 w-72 mona-orb mona-orb--orange" />

      <section className="mona-folder mona-card relative z-10 w-full max-w-lg rounded-[28px] p-5 sm:p-8">
        <BrandLogo size={46} showWordmark title="MONA" subtitle="Acesso protegido" />
        <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
          <KeyRound size={23} aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-ink-900">Crie sua senha pessoal</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Olá, {user?.name}. Este é seu primeiro acesso com uma senha temporária. Defina uma senha
          que somente você conheça para continuar.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Input
            label="Senha temporária atual"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <Input
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />

          {(localError || mutation.isError) && (
            <ErrorAlert message={localError || mutation.error?.message || 'Não foi possível alterar a senha.'} />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              !currentPassword || !newPassword || !confirmation || newPassword.length < 6 || mutation.isPending
            }
          >
            <ShieldCheck size={17} aria-hidden />
            {mutation.isPending ? 'Protegendo sua conta...' : 'Salvar senha e entrar'}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => void logout()}>
            <LogOut size={16} aria-hidden /> Sair desta conta
          </Button>
        </form>
      </section>
    </main>
  )
}
