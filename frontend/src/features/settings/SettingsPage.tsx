import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { UserPlus, Shield, Building2, User, Palette, Monitor } from 'lucide-react'
import { AppearanceStudio } from '../../shared/theme/AppearanceStudio'
import { api, getApiBase, setApiBaseOverride } from '../../shared/api/client'
import { isDesktopApp } from '../../shared/desktop'
import { useAuth } from '../../shared/auth/AuthContext'
import type { AccessType, Organization, SharedUser, UserProfile } from '../../shared/types'
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
} from '../../shared/permissions/constants'
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
  Select,
} from '../../shared/ui'

type TabId = 'people' | 'access' | 'org' | 'user' | 'appearance' | 'desktop'

export function SettingsPage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const desktop = isDesktopApp()

  const initialTab = (searchParams.get('tab') as TabId) || 'people'
  const [tab, setTab] = useState<TabId>(
    ['people', 'access', 'org', 'user', 'appearance', 'desktop'].includes(initialTab)
      ? initialTab
      : 'people',
  )
  const [showAccessType, setShowAccessType] = useState(false)
  const [showSharedUser, setShowSharedUser] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null)
  const [accessForm, setAccessForm] = useState({ name: '', permissions: [] as Permission[] })
  const [sharedForm, setSharedForm] = useState({
    name: '',
    email: '',
    password: '',
    accessTypeId: '',
    assignedClientIds: [] as string[],
  })
  const [orgForm, setOrgForm] = useState<Partial<Organization>>({})
  const [userForm, setUserForm] = useState<Partial<UserProfile>>({})
  const [apiBaseDraft, setApiBaseDraft] = useState(() => getApiBase())
  const [apiBaseSaved, setApiBaseSaved] = useState(false)

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: () => api.get<Organization>('/organizations/me'),
  })

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => api.get<UserProfile>('/users/me'),
  })

  const { data: accessTypes = [] } = useQuery({
    queryKey: ['access-types'],
    queryFn: () => api.get<AccessType[]>('/access-types'),
  })

  const { data: sharedUsers = [] } = useQuery({
    queryKey: ['shared-users'],
    queryFn: () => api.get<SharedUser[]>('/shared-users'),
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/clients'),
  })

  useEffect(() => {
    if (org) setOrgForm(org)
  }, [org])

  useEffect(() => {
    if (profile) setUserForm(profile)
  }, [profile])

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tab)
        return next
      },
      { replace: true },
    )
  }, [tab, setSearchParams])

  const orgMutation = useMutation({
    mutationFn: () => api.patch('/organizations/me', orgForm),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['organization'] }),
  })

  const userMutation = useMutation({
    mutationFn: () => api.patch('/users/me', userForm),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['user-profile'] }),
  })

  const accessTypeMutation = useMutation({
    mutationFn: () => api.post('/access-types', accessForm),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['access-types'] })
      setShowAccessType(false)
      setAccessForm({ name: '', permissions: [] })
    },
  })

  const selectedAccessType = accessTypes.find((a) => a.id === sharedForm.accessTypeId)
  const isEqualHierarchy =
    Boolean(selectedAccessType?.isOwnerType) || selectedAccessType?.name === 'Co-admin'

  const sharedUserMutation = useMutation({
    mutationFn: () =>
      api.post('/shared-users', {
        ...sharedForm,
        assignedClientIds: isEqualHierarchy ? [] : sharedForm.assignedClientIds,
        isOwner: isEqualHierarchy,
      }),
    onSuccess: (_data, _vars) => {
      void qc.invalidateQueries({ queryKey: ['shared-users'] })
      setCreatedCreds({ email: sharedForm.email, password: sharedForm.password })
      setShowSharedUser(false)
      setSharedForm({ name: '', email: '', password: '', accessTypeId: '', assignedClientIds: [] })
    },
  })

  const canCreatePeople = Boolean(user?.isOwner)
  const tabs = useMemo(() => {
    const list: { id: TabId; label: string; icon: typeof UserPlus }[] = [
      { id: 'people', label: 'Pessoas e acessos', icon: UserPlus },
      { id: 'access', label: 'Tipos de acesso', icon: Shield },
      { id: 'org', label: 'Empresa', icon: Building2 },
      { id: 'user', label: 'Meu perfil', icon: User },
      { id: 'appearance', label: 'Aparência', icon: Palette },
    ]
    if (desktop) list.push({ id: 'desktop', label: 'Desktop / API', icon: Monitor })
    return list
  }, [desktop])

  const togglePermission = (perm: Permission) => {
    setAccessForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }))
  }

  if (orgLoading || profileLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Configurações"
        subtitle="Pessoas, permissões, empresa e aparência — ponto único para a Ju gerir a operação."
      />

      {createdCreds && (
        <Card className="mb-4 border-brand-500/40 bg-brand-50">
          <p className="text-sm font-semibold text-brand-900">Login criado — teste ponta a ponta</p>
          <p className="mt-1 text-sm text-ink-700">
            Abra uma janela anônima / outro navegador e entre com:
          </p>
          <p className="mt-2 font-mono text-sm text-ink-900">
            {createdCreds.email} · {createdCreds.password}
          </p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => setCreatedCreds(null)}>
            Ok, entendi
          </Button>
        </Card>
      )}

      <div className="mb-6 flex flex-wrap gap-2 border-b border-ink-100 pb-2">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-brand-800 text-white shadow-sm'
                  : 'text-ink-700 hover:bg-ink-50'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'people' && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="border-brand-500/25 bg-brand-50/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
                Equipe / assistentes
              </p>
              <p className="mt-1 text-sm text-ink-700">
                Crie logins para outras assistentes ou co-admins. Cada uma entra com e-mail e senha e
                vê só o que o <strong>tipo de acesso</strong> + clientes atribuídos permitem.
              </p>
              <Button
                className="mt-3"
                disabled={!canCreatePeople}
                onClick={() => setShowSharedUser(true)}
              >
                <UserPlus size={16} /> Criar usuário da equipe
              </Button>
              {!canCreatePeople && (
                <p className="mt-2 text-xs text-ink-500">
                  Somente a conta principal (Ju) cria logins. Peça à Ju ou use um tipo Co-admin.
                </p>
              )}
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Clientes (contratantes)
              </p>
              <p className="mt-1 text-sm text-ink-700">
                Clientes <strong>não entram com login de equipe</strong> neste ciclo. Eles usam o{' '}
                <Link to="/compartilhar" className="font-semibold text-brand-800 hover:underline">
                  portal por link
                </Link>{' '}
                (mensagens, docs, câmera) — alinhado ao briefing original de compartilhamento.
              </p>
              <Link to="/compartilhar" className="mt-3 inline-block">
                <Button variant="secondary" size="sm">
                  Ir para links de portal
                </Button>
              </Link>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink-900">
              Pessoas na organização ({sharedUsers.length})
            </h2>
            <Button size="sm" variant="secondary" onClick={() => setTab('access')}>
              Gerir tipos de acesso
            </Button>
          </div>

          {sharedUsers.length === 0 ? (
            <EmptyState
              title="Nenhuma pessoa além do seed"
              description="Crie uma assistente para testar permissões em outra sessão."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-ink-100 bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/80">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">E-mail / login</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Clientes</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedUsers.map((su) => (
                    <tr key={su.id} className="border-b border-ink-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-ink-900">{su.name}</span>
                        {su.isOwner && (
                          <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                            Conta principal
                          </span>
                        )}
                        {su.isCurrentUser && (
                          <span className="ml-1 text-[11px] text-ink-500">(você)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-700">{su.email}</td>
                      <td className="px-4 py-3">{su.accessTypeName || '—'}</td>
                      <td className="px-4 py-3">
                        {su.isOwner ? 'Todos' : `${su.assignedClientIds.length} atribuído(s)`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'access' && (
        <div>
          <p className="mb-3 text-sm text-ink-600">
            Tipos = pacotes de permissões (ex.: Assistente, Qualidade, Financeiro). Depois associe ao
            criar uma pessoa.
          </p>
          <div className="mb-4">
            <Button onClick={() => setShowAccessType(true)}>Criar tipo de acesso</Button>
          </div>
          {accessTypes.length === 0 ? (
            <EmptyState title="Nenhum tipo de acesso" />
          ) : (
            <div className="space-y-3">
              {accessTypes.map((at) => (
                <Card key={at.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-ink-900">{at.name}</h3>
                    {at.isOwnerType && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                        Hierarquia principal
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {at.permissions.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-ink-50 px-2 py-0.5 text-xs text-ink-700 ring-1 ring-ink-100"
                      >
                        {PERMISSION_LABELS[p as Permission] || p}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'org' && (
        <Card className="max-w-xl">
          <div className="space-y-4">
            <Input
              label="Nome"
              value={orgForm.name || ''}
              onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
            />
            <Input
              label="Documento"
              value={orgForm.document || ''}
              onChange={(e) => setOrgForm({ ...orgForm, document: e.target.value })}
            />
            <Input
              label="Telefone"
              value={orgForm.phone || ''}
              onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
            />
            <Input
              label="E-mail"
              value={orgForm.email || ''}
              onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
            />
            <Input
              label="Endereço"
              value={orgForm.address || ''}
              onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
            />
            <Button onClick={() => orgMutation.mutate()} disabled={orgMutation.isPending}>
              Salvar
            </Button>
          </div>
        </Card>
      )}

      {tab === 'user' && (
        <Card className="max-w-xl">
          <div className="space-y-4">
            <Input
              label="Nome"
              value={userForm.name || ''}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            />
            <Input
              label="E-mail"
              value={userForm.email || ''}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              disabled
            />
            <Input
              label="Telefone"
              value={userForm.phone || ''}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
            />
            <Button onClick={() => userMutation.mutate()} disabled={userMutation.isPending}>
              Salvar
            </Button>
          </div>
        </Card>
      )}

      {tab === 'appearance' && <AppearanceStudio />}

      {tab === 'desktop' && desktop && (
        <Card className="max-w-xl border-brand-800/20 bg-brand-50/30">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">App desktop — URL da API</p>
              <p className="text-xs text-ink-500">
                Mesmas APIs da web. Altere se o servidor não for o padrão do build.
              </p>
            </div>
            <Input
              label="Base da API"
              value={apiBaseDraft}
              onChange={(e) => {
                setApiBaseDraft(e.target.value)
                setApiBaseSaved(false)
              }}
              placeholder="http://localhost:5080/api/v1"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setApiBaseOverride(apiBaseDraft)
                  setApiBaseSaved(true)
                }}
              >
                Salvar URL
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setApiBaseOverride(null)
                  setApiBaseDraft(getApiBase())
                  setApiBaseSaved(true)
                }}
              >
                Usar padrão do build
              </Button>
            </div>
            {apiBaseSaved && (
              <p className="text-xs text-emerald-600">
                Salvo. Recarregue a janela se as chamadas ainda falharem.
              </p>
            )}
          </div>
        </Card>
      )}

      <Modal
        open={showAccessType}
        onClose={() => setShowAccessType(false)}
        title="Novo tipo de acesso"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nome (ex.: Assistente, Qualidade, Financeiro)"
            value={accessForm.name}
            onChange={(e) => setAccessForm({ ...accessForm, name: e.target.value })}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-ink-900">Permissões liberadas</p>
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-ink-100 p-3">
              {ALL_PERMISSIONS.map((perm) => (
                <Checkbox
                  key={perm}
                  label={PERMISSION_LABELS[perm]}
                  checked={accessForm.permissions.includes(perm)}
                  onChange={() => togglePermission(perm)}
                />
              ))}
            </div>
          </div>
          <Button disabled={!accessForm.name} onClick={() => accessTypeMutation.mutate()}>
            Salvar tipo
          </Button>
        </div>
      </Modal>

      <Modal
        open={showSharedUser}
        onClose={() => setShowSharedUser(false)}
        title="Criar usuário da equipe"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            A pessoa poderá entrar no app (web ou desktop) com este e-mail e senha. Use um tipo de
            acesso já criado e, se não for conta principal, escolha os clientes dela.
          </p>
          <Input
            label="Nome"
            value={sharedForm.name}
            onChange={(e) => setSharedForm({ ...sharedForm, name: e.target.value })}
          />
          <Input
            label="E-mail (login)"
            type="email"
            value={sharedForm.email}
            onChange={(e) => setSharedForm({ ...sharedForm, email: e.target.value })}
          />
          <Input
            label="Senha inicial"
            type="password"
            value={sharedForm.password}
            onChange={(e) => setSharedForm({ ...sharedForm, password: e.target.value })}
          />
          <Select
            label="Tipo de acesso"
            value={sharedForm.accessTypeId}
            onChange={(e) => setSharedForm({ ...sharedForm, accessTypeId: e.target.value })}
          >
            <option value="">Selecione...</option>
            {accessTypes.map((at) => (
              <option key={at.id} value={at.id}>
                {at.name}
              </option>
            ))}
          </Select>
          {accessTypes.length === 0 && (
            <p className="text-sm text-orange-700">
              Crie um tipo de acesso na aba correspondente antes de criar a pessoa.
            </p>
          )}
          {isEqualHierarchy ? (
            <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">
              Este tipo tem hierarquia igual à conta principal: acesso total, sem restrição por
              cliente.
            </p>
          ) : (
            <div>
              <p className="mb-2 text-sm font-medium text-ink-900">Clientes que ela poderá ver</p>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-ink-100 p-3">
                {clients.length === 0 ? (
                  <p className="text-xs text-ink-500">Nenhum cliente cadastrado ainda.</p>
                ) : (
                  clients.map((c) => (
                    <Checkbox
                      key={c.id}
                      label={c.name}
                      checked={sharedForm.assignedClientIds.includes(c.id)}
                      onChange={(e) => {
                        setSharedForm((prev) => ({
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
          {sharedUserMutation.isError && (
            <p className="text-sm text-red-600">
              {(sharedUserMutation.error as Error).message}
            </p>
          )}
          <Button
            disabled={
              !sharedForm.name ||
              !sharedForm.email ||
              !sharedForm.password ||
              !sharedForm.accessTypeId ||
              sharedUserMutation.isPending
            }
            onClick={() => sharedUserMutation.mutate()}
          >
            {sharedUserMutation.isPending ? 'Salvando...' : 'Criar login e liberar acesso'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
