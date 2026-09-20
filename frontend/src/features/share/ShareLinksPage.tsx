import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import type { ShareLink } from '../../shared/types'
import { Briefcase, Clock3, FileText, Folder } from 'lucide-react'
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  Input,
  LoadingSpinner,
  MobileHero,
  MobileRow,
  MobileSection,
  MobileStat,
  MobileTip,
  PageHeader,
  Select,
} from '../../shared/ui'

const SCOPES = [
  { value: 'portal', label: 'Portal completo (recomendado)' },
  { value: 'client', label: 'Resumo + mensagens + docs' },
  { value: 'finance', label: 'Só financeiro + comprovantes' },
  { value: 'contracts', label: 'Só contratos' },
  { value: 'agenda', label: 'Só agenda' },
]

export function ShareLinksPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    scope: 'portal',
    clientId: '',
    expiresAt: '',
    allowMessages: true,
    allowUploads: true,
    shareContactInfo: false,
  })
  const [createdUrl, setCreatedUrl] = useState('')

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['share-links'],
    queryFn: () => api.get<ShareLink[]>('/share-links'),
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/clients'),
  })

  const mutation = useMutation({
    mutationFn: () =>
      api.post<ShareLink>('/share-links', {
        scope: form.scope,
        clientId: form.clientId || null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        allowMessages: form.allowMessages,
        allowUploads: form.allowUploads,
        shareContactInfo: form.shareContactInfo,
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['share-links'] })
      setCreatedUrl(`${window.location.origin}/s/${data.token}`)
    },
  })

  const patchMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api.patch(`/share-links/${id}`, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['share-links'] }),
  })

  if (isLoading) return <LoadingSpinner />

  const activeLinks = links.filter((l) => l.isActive !== false && !l.expired)

  return (
    <div>
      <div className="mona-mobile-only mona-m-stack">
        <MobileHero
          kicker="Portal contratante"
          title="Conectando você aos resultados"
          lead="Área do contratante para acompanhar solicitações, aprovações, documentos e o andamento dos projetos."
          note="Parceria que gera grandes resultados"
        />
        <div className="mona-m-stats">
          <MobileStat icon={FileText} label="Solicitações" value={links.length} hint="links gerados" tone="purple" />
          <MobileStat icon={Clock3} label="Pendentes" value={links.filter((l) => l.expired).length} hint="expirados" tone="orange" />
          <MobileStat icon={Folder} label="Ativos" value={activeLinks.length} hint="prontos para uso" tone="mint" />
        </div>
        <MobileSection title="Últimas solicitações" action={{ to: '/compartilhar', label: 'Ver todas' }}>
          <div className="mona-m-list">
            {links.slice(0, 6).map((link) => (
              <MobileRow
                key={link.id}
                to={link.clientId ? `/clientes/${link.clientId}` : '/compartilhar'}
                icon={<span className="mona-m-icon"><Briefcase size={15} /></span>}
                title={link.clientName || link.scope}
                meta={link.expiresAt ? new Date(link.expiresAt).toLocaleDateString('pt-BR') : 'Sem validade'}
                trailing={
                  <span className="mona-m-badge">
                    {link.isActive === false ? 'Revogado' : link.expired ? 'Expirado' : 'Ativo'}
                  </span>
                }
              />
            ))}
            {links.length === 0 && <EmptyState title="Nenhum link criado" />}
          </div>
        </MobileSection>
        <MobileTip>Gere um link com o escopo certo e o cliente vê só o que precisa.</MobileTip>
      </div>

      <div className="mona-desktop-only">
      <PageHeader
        title="Portal do contratante"
        subtitle="Controle o que o cliente publica/vê pelo link — sem login. Revogue a qualquer momento."
      />

      <Card className="mb-6 max-w-xl">
        <h2 className="mb-1 font-semibold text-ink-900">Gerar link com ACL</h2>
        <p className="mb-4 text-xs text-ink-500">
          Padrão: sem telefone/e-mail; validade automática (90 dias / 30 no financeiro). Também dá
          para gerar na ficha do cliente → aba Portal.
        </p>
        <div className="space-y-4">
          <Select
            label="O que o contratante vê"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
          >
            {SCOPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select
            label="Cliente (contratante)"
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          >
            <option value="">Selecione…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Expira em (opcional — senão usa o padrão)"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
          <div className="space-y-2 rounded-xl border border-ink-100 p-3">
            <p className="text-xs font-semibold uppercase text-ink-500">Capacidades</p>
            <Checkbox
              label="Pode enviar mensagens"
              checked={form.allowMessages}
              onChange={(e) => setForm({ ...form, allowMessages: e.target.checked })}
            />
            <Checkbox
              label="Pode enviar fotos / arquivos"
              checked={form.allowUploads}
              onChange={(e) => setForm({ ...form, allowUploads: e.target.checked })}
            />
            <Checkbox
              label="Mostrar telefone e e-mail do cliente"
              checked={form.shareContactInfo}
              onChange={(e) => setForm({ ...form, shareContactInfo: e.target.checked })}
            />
          </div>
          <Button disabled={!form.clientId || mutation.isPending} onClick={() => mutation.mutate()}>
            Gerar link do portal
          </Button>
          {mutation.isError && (
            <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
          )}
          {createdUrl && (
            <div className="rounded-xl bg-brand-50 p-3 text-sm">
              <p className="font-medium text-brand-950">Envie este link ao contratante:</p>
              <a href={createdUrl} className="break-all text-brand-800 hover:underline">
                {createdUrl}
              </a>
            </div>
          )}
        </div>
      </Card>

      {links.length === 0 ? (
        <EmptyState title="Nenhum link criado" description="Gere um link acima ou na ficha do cliente." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50/80">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Escopo</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">ACL</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const inactive = link.isActive === false
                const expired = !!link.expired
                return (
                  <tr key={link.id} className="border-b border-ink-50">
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          inactive
                            ? 'bg-ink-100 text-ink-600'
                            : expired
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {inactive ? 'Revogado' : expired ? 'Expirado' : 'Ativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{link.scope}</td>
                    <td className="px-4 py-3">
                      {link.clientId ? (
                        <Link
                          to={`/clientes/${link.clientId}`}
                          className="text-brand-800 hover:underline"
                        >
                          {link.clientName || 'Cliente'}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {link.expiresAt
                        ? new Date(link.expiresAt).toLocaleString('pt-BR')
                        : 'Sem validade'}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-600">
                      {[
                        link.allowMessages ? 'msgs' : null,
                        link.allowUploads ? 'upload' : null,
                        link.shareContactInfo ? 'contato' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'só leitura'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <a
                          href={`/s/${link.token}`}
                          className="text-brand-800 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir
                        </a>
                        {link.isActive !== false && !expired && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            disabled={patchMutation.isPending}
                            onClick={() =>
                              patchMutation.mutate({ id: link.id, isActive: false })
                            }
                          >
                            Revogar
                          </Button>
                        )}
                        {link.isActive === false && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={patchMutation.isPending}
                            onClick={() =>
                              patchMutation.mutate({ id: link.id, isActive: true })
                            }
                          >
                            Reativar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  )
}
