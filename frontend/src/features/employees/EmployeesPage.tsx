import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import type { Employee } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  EmptyState,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
} from '../../shared/ui'

export function EmployeesPage() {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.EmployeesWrite)
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', color: '#0F4C5C' })

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get<Employee[]>('/employees'),
  })

  const mutation = useMutation({
    mutationFn: () => api.post('/employees', form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['employees'] })
      setOpen(false)
      setForm({ name: '', phone: '', email: '', color: '#0F4C5C' })
    },
  })

  const sorted = [...employees].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Prestadores"
        subtitle="Lista de funcionários e prestadores"
        actions={
          canWrite ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              Adicionar prestador
            </Button>
          ) : undefined
        }
      />
      {sorted.length === 0 ? (
        <EmptyState title="Nenhum prestador cadastrado" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-sand-200 bg-white/90">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sand-200 bg-sand-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-teal-900">Cor</th>
                <th className="px-4 py-3 font-medium text-teal-900">Nome</th>
                <th className="px-4 py-3 font-medium text-teal-900">Telefone</th>
                <th className="px-4 py-3 font-medium text-teal-900">E-mail</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((emp) => (
                <tr key={emp.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                  <td className="px-4 py-3">
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-sand-300"
                      style={{ backgroundColor: emp.color || '#0F4C5C' }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/prestadores/${emp.id}`}
                      className="font-medium text-teal-900 hover:underline"
                    >
                      {emp.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-teal-700">{emp.phone || '—'}</td>
                  <td className="px-4 py-3 text-teal-700">{emp.email || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo prestador">
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Cor" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button disabled={!form.name || mutation.isPending} onClick={() => mutation.mutate()}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
