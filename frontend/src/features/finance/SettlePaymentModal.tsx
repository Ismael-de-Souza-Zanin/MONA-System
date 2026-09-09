import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { Button, Input, Modal } from '../../shared/ui'

type Props = {
  open: boolean
  paymentId: string | null
  label?: string
  onClose: () => void
  onSettled: () => void
}

export function SettlePaymentModal({ open, paymentId, label, onClose, onSettled }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [adminPassword, setAdminPassword] = useState('')
  const [error, setError] = useState('')

  const settle = useMutation({
    mutationFn: async () => {
      if (!paymentId) throw new Error('Pagamento inválido')
      if (!file && !adminPassword.trim()) {
        throw new Error('Envie um comprovante ou informe a senha da Ju/admin.')
      }
      const form = new FormData()
      if (file) form.append('proof', file)
      if (adminPassword.trim()) form.append('adminPassword', adminPassword.trim())
      return api.postForm(`/payments/${paymentId}/settle`, form)
    },
    onSuccess: () => {
      setFile(null)
      setAdminPassword('')
      setError('')
      onSettled()
      onClose()
    },
    onError: (e: Error) => setError(e.message || 'Falha ao dar baixa'),
  })

  return (
    <Modal
      open={open}
      onClose={() => {
        setError('')
        onClose()
      }}
      title="Dar baixa"
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-600">
          {label ? <strong className="text-ink-900">{label}</strong> : 'Pagamento'} — é obrigatório{' '}
          <strong>comprovante (arquivo)</strong> ou <strong>senha da Ju/admin</strong>.
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Comprovante</label>
          <input
            type="file"
            accept=".pdf,image/*"
            className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-900"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Input
          label="Ou senha da Ju / admin"
          type="password"
          autoComplete="current-password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="Senha da conta principal"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={settle.isPending} onClick={() => settle.mutate()}>
            Confirmar baixa
          </Button>
        </div>
      </div>
    </Modal>
  )
}
