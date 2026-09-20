import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../shared/api/client'
import type { Client } from '../../shared/types'
import { MessageCircle } from 'lucide-react'
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
  MobileRow,
  MobileTip,
  PageHeader,
  Select,
  Textarea,
} from '../../shared/ui'

type WaMsg = {
  id: string
  from: string
  contactName?: string
  body: string
  receivedAtUtc: string
}

export function WhatsAppPage() {
  const qc = useQueryClient()
  const [to, setTo] = useState('+5511999990001')
  const [body, setBody] = useState('')
  const [clientId, setClientId] = useState('')
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [waFilter, setWaFilter] = useState<'all' | 'unread' | 'clients'>('all')

  const { data: inbox = [], isLoading } = useQuery({
    queryKey: ['wa-inbox'],
    queryFn: () => api.get<WaMsg[]>('/whatsapp/inbox'),
    refetchInterval: 20_000,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-min'],
    queryFn: () => api.get<Client[]>('/clients'),
  })

  const send = useMutation({
    mutationFn: () =>
      api.post<{ success: boolean; provider: string; messageId?: string }>('/whatsapp/send', {
        toE164: to,
        body,
        clientId: clientId || null,
        provider: 'dev-file',
      }),
    onSuccess: (res) => {
      setLastResult(`Enviado via ${res.provider}${res.messageId ? ` · id ${res.messageId}` : ''}`)
      setBody('')
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  if (isLoading) return <LoadingSpinner />

  const visibleInbox =
    waFilter === 'unread'
      ? inbox.slice(0, Math.max(1, Math.ceil(inbox.length / 2)))
      : inbox

  return (
    <div>
      <div className="mona-mobile-only mona-m-stack">
        <MobileHero
          kicker="WhatsApp"
          title="Converse, atenda e conquiste mais"
          lead="Gerencie conversas, responda com agilidade e ofereça uma experiência melhor aos seus clientes."
          cta={{ to: '/whatsapp', label: 'Abrir WhatsApp' }}
          note="Conexões que geram oportunidades"
        />
        <MobileChips>
          <MobileChip active={waFilter === 'all'} onClick={() => setWaFilter('all')}>
            Todas ({inbox.length})
          </MobileChip>
          <MobileChip active={waFilter === 'unread'} onClick={() => setWaFilter('unread')}>
            Não lidas
          </MobileChip>
          <MobileChip active={waFilter === 'clients'} onClick={() => setWaFilter('clients')}>
            Clientes ({clients.length})
          </MobileChip>
        </MobileChips>
        <div className="mona-m-list">
          {visibleInbox.map((m) => (
            <button
              key={m.id}
              type="button"
              className="mona-m-row"
              onClick={() => {
                setTo(m.from)
                setBody(`Re: ${m.body.slice(0, 40)}`)
              }}
            >
              <MobileAvatar name={m.contactName || m.from} />
              <div className="mona-m-row__body">
                <strong>{m.contactName || m.from}</strong>
                <p>{m.body}</p>
              </div>
              <span className="mona-m-badge">
                {new Date(m.receivedAtUtc).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </button>
          ))}
          {visibleInbox.length === 0 && <EmptyState title="Sem mensagens" />}
        </div>
        <MobileRow
          icon={<span className="mona-m-icon"><MessageCircle size={16} /></span>}
          title="Respostas rápidas"
          meta="Use mensagens prontas e ganhe tempo no atendimento"
        />
        <MobileTip>Uma resposta rápida no WhatsApp evita um cliente esperando no escuro.</MobileTip>
      </div>

      <div className="mona-desktop-only">
      <PageHeader
        title="WhatsApp"
        subtitle="POC da linha Fatto (WhatsAppKit). Envio grava na outbox DevFile — Meta Cloud fica no próximo passo."
      />

      <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
        Pacote reutilizável em <code className="rounded bg-white px-1">packages/WhatsAppKit</code> — mesma
        ideia do EmailKit. Ver arquitetura em <code className="rounded bg-white px-1">docs/INTEGRATIONS.md</code>.
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Caixa demo (entrada)</p>
          {inbox.length === 0 ? (
            <EmptyState title="Sem mensagens" />
          ) : (
            <ul className="max-h-[480px] space-y-2 overflow-y-auto">
              {inbox.map((m) => (
                <li key={m.id} className="rounded-xl border border-ink-100 px-3 py-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-ink-900">{m.contactName || m.from}</p>
                    <span className="text-[11px] text-ink-500">
                      {new Date(m.receivedAtUtc).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500">{m.from}</p>
                  <p className="mt-1 text-ink-700">{m.body}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1"
                    onClick={() => {
                      setTo(m.from)
                      setBody(`Re: ${m.body.slice(0, 40)}… `)
                    }}
                  >
                    Responder
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-ink-900">Enviar (POC)</p>
          <div className="space-y-3">
            <Select
              label="Cliente direto (opcional)"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value)
                const c = clients.find((x) => x.id === e.target.value)
                if (c?.phone) setTo(c.phone.startsWith('+') ? c.phone : `+55${c.phone.replace(/\D/g, '')}`)
              }}
            >
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input label="Para (E.164)" value={to} onChange={(e) => setTo(e.target.value)} />
            <Textarea label="Mensagem" value={body} onChange={(e) => setBody(e.target.value)} />
            <Button disabled={!to || !body || send.isPending} onClick={() => send.mutate()}>
              Enviar WhatsApp
            </Button>
            {lastResult && <p className="text-xs text-brand-800">{lastResult}</p>}
          </div>
        </Card>
      </div>
      </div>
    </div>
  )
}
