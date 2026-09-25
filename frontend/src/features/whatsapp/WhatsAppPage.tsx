import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../shared/api/client'
import type { Client } from '../../shared/types'
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSpinner,
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


  return (
    <div>


      <div className="mona-responsive-content">
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
