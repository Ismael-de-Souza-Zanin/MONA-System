import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ChevronRight, Search, UserPlus, Users } from 'lucide-react'
import { api } from '../../shared/api/client'
import type { AccessType, Client, Employee, SharedUser } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import { useAuth } from '../../shared/auth/AuthContext'
import {
  Button,
  Checkbox,
  EmptyState,
  Input,
  LoadingSpinner,
  MobileAvatar,
  MobilePageHeader,
  MobileStat,
  Modal,
  PageHeader,
  Select,
} from '../../shared/ui'

type TeamMember = Employee & {
  userId?: string
  accessTypeName?: string
  isOwner?: boolean
  assignedClientIds?: string[]
}

export function EmployeesPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.EmployeesWrite) || hasPermission(Permissions.Settings)
  const canCreateLogin = !!user?.isOwner || hasPermission(Permissions.Settings)
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    accessTypeId: '',
    assignedClientIds: [] as string[],
  })

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get<TeamMember[]>('/employees'),
  })

  const { data: accessTypes = [] } = useQuery({
    queryKey: ['access-types'],
    queryFn: () => api.get<AccessType[]>('/access-types'),
    enabled: open && canCreateLogin,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-lite'],
    queryFn: () => api.get<Client[]>('/clients'),
    enabled: open && canCreateLogin,
  })

  const selectedAccess = accessTypes.find((a) => a.id === form.accessTypeId)
  const isEqualHierarchy = !!selectedAccess?.isOwnerType

  const mutation = useMutation({
    mutationFn: () =>
      api.post<SharedUser & { employeeId?: string }>('/shared-users', {
        name: form.name,
        email: form.email,
        password: form.password,
        accessTypeId: form.accessTypeId,
        assignedClientIds: isEqualHierarchy ? [] : form.assignedClientIds,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['employees'] })
      void qc.invalidateQueries({ queryKey: ['shared-users'] })
      setOpen(false)
      setForm({ name: '', email: '', password: '', accessTypeId: '', assignedClientIds: [] })
    },
  })

  const sorted = [...employees].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  if (isLoading) return <LoadingSpinner />

  const filtered = sorted.filter(
    (emp) =>
      !search.trim() ||
      `${emp.name} ${emp.email || ''} ${emp.accessTypeName || ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )

  const withClients = employees.filter((emp) => (emp.assignedClientIds?.length ?? 0) > 0).length

  return (
    <div>
      <div className="mona-phone mona-m-stack">
        <MobilePageHeader title="Minha equipe" />
        <div className="mona-m-stats is-pair">
          <MobileStat icon={Users} label="Na equipe" value={employees.length} hint="com login na MONA" tone="mint" />
          <MobileStat icon={UserPlus} label="Com clientes" value={withClients} hint="atribuição direta" tone="orange" />
        </div>
        <label className="mona-m-search">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar prestador..." />
        </label>
        {filtered.length === 0 ? <EmptyState title="Ninguém com login ainda" /> : (
          <div className="mona-m-list">
            {filtered.map((emp) => (
              <article key={emp.id} className="mona-m-person">
                <Link to={`/prestadores/${emp.id}`} className="mona-m-person__main">
                  <MobileAvatar name={emp.name} />
                  <div>
                    <strong>{emp.name}</strong>
                    <p>{emp.accessTypeName || 'Equipe'}{emp.email ? ` · ${emp.email}` : ''}</p>
                    <span className={`mona-m-badge ${emp.isOwner ? 'is-status-notice' : 'is-status-active'}`}>{emp.isOwner ? 'Principal' : 'Ativo'}</span>
                  </div>
                </Link>
                <div className="mona-m-person__tools">
                  <Link to="/agenda" aria-label="Agenda"><Calendar size={18} /></Link>
                  <Link to={`/prestadores/${emp.id}`} aria-label="Abrir ficha"><ChevronRight size={18} /></Link>
                </div>
              </article>
            ))}
          </div>
        )}
        {canCreateLogin && (
          <button type="button" className="mona-m-banner" onClick={() => setOpen(true)}>
            <span className="mona-m-icon"><UserPlus size={18} /></span>
            <span><strong>Novo prestador</strong><p>Crie um login para a pessoa entrar na equipe.</p></span>
            <ChevronRight size={18} />
          </button>
        )}
      </div>
      <div className="mona-responsive-content mona-desk">
        <PageHeader
          title="Minha equipe"
          subtitle="Somente quem tem usuário (login) na MONA"
          actions={
            canCreateLogin ? (
              <Button size="sm" onClick={() => setOpen(true)}>
                Criar usuário da equipe
              </Button>
            ) : undefined
          }
        />
        <div className="mb-4"><Input label="Buscar na equipe" placeholder="Nome, login ou tipo de acesso" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        {filtered.length === 0 ? (
          <EmptyState
            title="Ninguém com login ainda"
            description="Crie um usuário com e-mail e senha para a pessoa aparecer aqui."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-sand-200 bg-white/90">
            <table className="mona-data-table w-full text-left text-sm">
              <thead className="border-b border-sand-200 bg-sand-50/80">
                <tr>
                  <th className="px-4 py-3 font-medium text-teal-900">Nome</th>
                  <th className="px-4 py-3 font-medium text-teal-900">Login</th>
                  <th className="px-4 py-3 font-medium text-teal-900">Tipo</th>
                  <th className="px-4 py-3 font-medium text-teal-900">Clientes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                    <td data-label="Nome" className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 rounded-full border border-sand-300"
                          style={{ backgroundColor: emp.color || '#0F4C5C' }}
                        />
                        <Link
                          to={`/prestadores/${emp.id}`}
                          className="font-medium text-teal-900 hover:underline"
                        >
                          {emp.name}
                        </Link>
                        {emp.isOwner && (
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                            Principal
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Login" className="px-4 py-3 font-mono text-xs text-teal-700">{emp.email || '—'}</td>
                    <td data-label="Tipo" className="px-4 py-3 text-teal-700">{emp.accessTypeName || '—'}</td>
                    <td data-label="Clientes" className="px-4 py-3 text-teal-700">
                      {emp.isOwner ? 'Todos' : `${emp.assignedClientIds?.length ?? 0} atribuído(s)`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!canCreateLogin && canWrite && (
          <p className="mt-3 text-sm text-ink-500">
            Só a conta principal cria logins. Peça em{' '}
            <Link to="/configuracoes?tab=people" className="text-brand-800 hover:underline">
              Configurações
            </Link>
            .
          </p>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Criar usuário da equipe">
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            Cria o login na MONA. Sem isso, a pessoa não entra em Minha equipe.
          </p>
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="E-mail (login)"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Senha inicial"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Tipo de acesso"
            value={form.accessTypeId}
            onChange={(e) => setForm({ ...form, accessTypeId: e.target.value })}
          >
            <option value="">Selecione…</option>
            {accessTypes.map((at) => (
              <option key={at.id} value={at.id}>
                {at.name}
              </option>
            ))}
          </Select>
          {accessTypes.length === 0 && (
            <p className="text-sm text-orange-700">
              Crie um tipo de acesso em Configurações antes.
            </p>
          )}
          {isEqualHierarchy ? (
            <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">
              Este tipo tem acesso total (como a conta principal).
            </p>
          ) : (
            <div>
              <p className="mb-2 text-sm font-medium text-ink-900">Clientes que poderá ver</p>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-ink-100 p-3">
                {clients.length === 0 ? (
                  <p className="text-xs text-ink-500">Nenhum cliente cadastrado ainda.</p>
                ) : (
                  clients.map((c) => (
                    <Checkbox
                      key={c.id}
                      label={c.name}
                      checked={form.assignedClientIds.includes(c.id)}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          assignedClientIds: e.target.checked
                            ? [...prev.assignedClientIds, c.id]
                            : prev.assignedClientIds.filter((id) => id !== c.id),
                        }))
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )}
          {mutation.isError && (
            <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !form.name ||
                !form.email ||
                !form.password ||
                !form.accessTypeId ||
                mutation.isPending
              }
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Criando…' : 'Criar login e adicionar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
