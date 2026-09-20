import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../shared/api/client'
import type { Client, EmailAccount, MailboxMessage, ScheduledEmail } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import { useTimeZones, useUserPreferences } from '../../shared/hooks/useWorkspaceData'
import { PenSquare } from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSpinner,
  MobileAvatar,
  MobileChip,
  MobileChips,
  MobileHero,
  MobileTip,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../../shared/ui'

export function EmailsPage() {
  const { hasPermission } = usePermissions()
  const canSend = hasPermission(Permissions.EmailsSend)
  const { preferences } = useUserPreferences()
  const { data: timezones = [] } = useTimeZones()
  const qc = useQueryClient()

  const [accountId, setAccountId] = useState('')
  const [folder, setFolder] = useState('INBOX')
  const [selectedMsg, setSelectedMsg] = useState<MailboxMessage | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [form, setForm] = useState({
    clientId: '',
    toAddress: '',
    subject: '',
    body: '',
    sendAt: '',
    timeZoneId: '',
  })

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['email-accounts'],
    queryFn: () => api.get<EmailAccount[]>('/emails/accounts'),
  })

  const activeAccountId = accountId || accounts[0]?.id || ''

  const { data: mailbox, isLoading: loadingMailbox } = useQuery({
    queryKey: ['mailbox', activeAccountId, folder],
    queryFn: () =>
      api.get<{ account: EmailAccount; messages: MailboxMessage[] }>(
        `/emails/mailbox/${activeAccountId}?folder=${folder}`,
      ),
    enabled: !!activeAccountId,
  })

  const { data: scheduled = [] } = useQuery({
    queryKey: ['scheduled-emails'],
    queryFn: () => api.get<ScheduledEmail[]>('/emails/scheduled'),
    refetchInterval: 15_000,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-min'],
    queryFn: () => api.get<Client[]>('/clients'),
    enabled: canSend,
  })

  const scheduleMutation = useMutation({
    mutationFn: () =>
      api.post('/emails/schedule', {
        clientId: form.clientId,
        toAddress: form.toAddress || undefined,
        subject: form.subject,
        body: form.body,
        sendAt: form.sendAt,
        timeZoneId:
          form.timeZoneId ||
          preferences?.effectiveTimeZoneId ||
          preferences?.timeZoneId ||
          'America/Sao_Paulo',
        isUtc: false,
        provider: 'dev-file',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['scheduled-emails'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
      setShowSchedule(false)
    },
  })

  const sendNowMutation = useMutation({
    mutationFn: (id: string) => api.post(`/emails/schedule/${id}/send-now`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['scheduled-emails'] }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/emails/schedule/${id}/cancel`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['scheduled-emails'] }),
  })

  const effectiveTz = preferences?.effectiveTimeZoneId || preferences?.timeZoneId || 'America/Sao_Paulo'

  const pending = useMemo(
    () => scheduled.filter((s) => s.status === 'Scheduled'),
    [scheduled],
  )

  if (loadingAccounts) return <LoadingSpinner />

  const messages = mailbox?.messages ?? []
  const unread = messages.filter((m) => !m.isRead).length

  return (
    <div>
      <div className="mona-mobile-only mona-m-stack">
        <MobileHero
          kicker="E-mails"
          title="Todas as suas comunicações em um só lugar"
          lead="Centralize seus e-mails, acompanhe o cliente e mantenha a equipe alinhada."
          note="Conexões que fazem o negócio avançar"
        />
        <MobileChips>
          <MobileChip active={folder === 'INBOX'} onClick={() => setFolder('INBOX')}>
            Todos ({messages.length})
          </MobileChip>
          <MobileChip active={false} onClick={() => setFolder('INBOX')}>
            Não lidos ({unread})
          </MobileChip>
          <MobileChip active={folder === 'SENT'} onClick={() => setFolder('SENT')}>
            Enviados
          </MobileChip>
        </MobileChips>
        <div className="mona-m-list">
          {messages.slice(0, 8).map((m) => (
            <button key={m.id} type="button" className="mona-m-row" onClick={() => setSelectedMsg(m)}>
              <MobileAvatar name={m.from} />
              <div className="mona-m-row__body">
                <strong>{m.subject || '(sem assunto)'}</strong>
                <p>{m.snippet || m.from}</p>
              </div>
              <span className="mona-m-badge">
                {new Date(m.receivedAtUtc).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </button>
          ))}
          {messages.length === 0 && <EmptyState title="Caixa vazia" />}
        </div>
        {canSend && (
          <button type="button" className="mona-m-fab" onClick={() => setShowSchedule(true)} aria-label="Novo e-mail">
            <PenSquare size={18} />
          </button>
        )}
        <MobileTip>Um e-mail claro hoje evita três mensagens amanhã.</MobileTip>
      </div>

      <div className="mona-desktop-only">
      <PageHeader
        title="E-mails"
        subtitle={`Caixas dos clientes diretos (POC) · fuso efetivo ${effectiveTz}. Envio programado já dispara via EmailKit.`}
        actions={
          canSend && (
            <Button
              onClick={() => {
                const acc = accounts.find((a) => a.id === activeAccountId)
                setForm({
                  clientId: acc?.clientId || clients[0]?.id || '',
                  toAddress: acc?.emailAddress || '',
                  subject: '',
                  body: '',
                  sendAt: '',
                  timeZoneId: effectiveTz,
                })
                setShowSchedule(true)
              }}
            >
              Programar envio
            </Button>
          )
        }
      />

      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Escopo: <strong>clientes diretos</strong> apenas. Leitura em modo demo (Gmail/Outlook stubs prontos no
        pacote <code className="rounded bg-white px-1">packages/EmailKit</code>). Envio POC grava em outbox
        DevFile e marca como Sent.
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_1fr_320px]">
        <Card className="p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Contas</p>
          <ul className="space-y-1">
            {accounts.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setAccountId(a.id)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                    activeAccountId === a.id ? 'bg-brand-50 text-brand-900' : 'hover:bg-ink-50'
                  }`}
                >
                  <p className="font-medium">{a.clientName}</p>
                  <p className="text-xs text-ink-500">{a.emailAddress}</p>
                  <p className="text-[11px] text-ink-400">
                    {a.provider}
                    {a.isDemo ? ' · demo' : ''}
                  </p>
                </button>
              </li>
            ))}
            {accounts.length === 0 && (
              <li className="px-2 py-6 text-center text-sm text-ink-500">
                Cadastre clientes para gerar caixas demo.
              </li>
            )}
          </ul>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="flex min-w-0 items-center gap-2 border-b border-ink-100 px-4 py-3">
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs ${folder === 'INBOX' ? 'bg-brand-800 text-white' : 'bg-ink-50'}`}
              onClick={() => setFolder('INBOX')}
            >
              Entrada
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs ${folder === 'SENT' ? 'bg-brand-800 text-white' : 'bg-ink-50'}`}
              onClick={() => setFolder('SENT')}
            >
              Enviados
            </button>
            <span className="ml-auto min-w-0 truncate text-xs text-ink-500">{mailbox?.account.emailAddress}</span>
          </div>
          {loadingMailbox ? (
            <LoadingSpinner />
          ) : !mailbox?.messages.length ? (
            <EmptyState title="Caixa vazia" />
          ) : (
            <ul className="divide-y divide-ink-50">
              {mailbox.messages.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`w-full px-4 py-3 text-left hover:bg-ink-50 ${!m.isRead ? 'bg-brand-50/40' : ''}`}
                    onClick={() => setSelectedMsg(m)}
                  >
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-semibold text-ink-900">{m.subject}</p>
                      <span className="shrink-0 text-[11px] text-ink-500">
                        {new Date(m.receivedAtUtc).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-ink-600">{m.from}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-ink-500">{m.snippet}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Programados ({pending.length})
          </p>
          <ul className="max-h-[480px] space-y-2 overflow-y-auto">
            {scheduled.map((s) => (
              <li key={s.id} className="rounded-xl border border-ink-100 px-3 py-2 text-sm">
                <p className="font-medium text-ink-900">{s.subject}</p>
                <p className="text-xs text-ink-500">
                  {s.clientName} · {s.toAddress}
                </p>
                <p className="mt-1 text-xs text-ink-600">
                  {s.scheduledAtLocal
                    ? new Date(s.scheduledAtLocal).toLocaleString('pt-BR')
                    : new Date(s.scheduledAtUtc).toLocaleString('pt-BR')}{' '}
                  · {s.displayTimeZoneId || s.scheduledInTimeZoneId}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-brand-800">
                  {s.status}
                  {s.providerKey ? ` · ${s.providerKey}` : ''}
                </p>
                {s.error && <p className="text-xs text-red-600">{s.error}</p>}
                {s.status === 'Scheduled' && canSend && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => sendNowMutation.mutate(s.id)}>
                      Enviar agora
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => cancelMutation.mutate(s.id)}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </li>
            ))}
            {scheduled.length === 0 && (
              <li className="py-8 text-center text-sm text-ink-500">Nenhum e-mail programado</li>
            )}
          </ul>
        </Card>
      </div>
      </div>

      <Modal open={!!selectedMsg} onClose={() => setSelectedMsg(null)} title={selectedMsg?.subject || 'Mensagem'}>
        {selectedMsg && (
          <div className="space-y-2 text-sm">
            <p className="text-ink-500">De: {selectedMsg.from}</p>
            <p className="text-ink-500">Para: {selectedMsg.to?.join(', ')}</p>
            <p className="whitespace-pre-wrap text-ink-800">{selectedMsg.body || selectedMsg.snippet}</p>
          </div>
        )}
      </Modal>

      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Programar e-mail (cliente direto)">
        <div className="space-y-3">
          <Select
            label="Cliente direto"
            value={form.clientId}
            onChange={(e) => {
              const c = clients.find((x) => x.id === e.target.value)
              setForm({
                ...form,
                clientId: e.target.value,
                toAddress: c?.email || form.toAddress,
              })
            }}
          >
            <option value="">Selecione</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Para"
            value={form.toAddress}
            onChange={(e) => setForm({ ...form, toAddress: e.target.value })}
          />
          <Input
            label="Assunto"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <Textarea
            label="Corpo"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
          <Input
            label="Enviar em (fuso escolhido)"
            type="datetime-local"
            value={form.sendAt}
            onChange={(e) => setForm({ ...form, sendAt: e.target.value })}
          />
          <Select
            label="Fuso do agendamento"
            value={form.timeZoneId || effectiveTz}
            onChange={(e) => setForm({ ...form, timeZoneId: e.target.value })}
          >
            {(timezones.length ? timezones : [{ id: effectiveTz, label: effectiveTz }]).map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-ink-500">
            Se você estiver em viagem, use o fuso efetivo ({effectiveTz}) para não confundir o horário local.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowSchedule(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!form.clientId || !form.subject || !form.sendAt || scheduleMutation.isPending}
              onClick={() => scheduleMutation.mutate()}
            >
              Programar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
