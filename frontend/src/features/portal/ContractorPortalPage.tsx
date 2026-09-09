import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { API_BASE } from '../../shared/api/client'
import { BrandLogo, Button, Card, EmptyState, Input, LoadingSpinner, Textarea } from '../../shared/ui'

type PortalData = {
  scope: string
  brand?: string
  client?: {
    name: string
    companyName?: string
    phone?: string
    email?: string
    status?: string
    nextAction?: string
    nextActionAtUtc?: string
    relationshipStage?: string
  }
  finance?: {
    pendingTotal: number
    paidTotal: number
    items: {
      description: string
      amount: number
      status: string
      dueDate?: string
      paidAt?: string
    }[]
  }
  contracts?: { name: string; status: string; hasPdf: boolean }[]
  agenda?: { title: string; startAt: string; endAt?: string }[]
  documents?: {
    id: string
    title: string
    fileName: string
    kind: string
    uploadedBy: string
    uploaderLabel?: string
    createdAt: string
  }[]
  messages?: {
    id: string
    body: string
    fromContractor: boolean
    authorLabel: string
    createdAt: string
  }[]
  faqs?: { question: string; answer: string }[]
  capabilities?: {
    canMessage?: boolean
    canUpload?: boolean
    canViewFinance?: boolean
    canViewContracts?: boolean
    canViewAgenda?: boolean
  }
}

function money(v?: number) {
  return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ContractorPortalPage() {
  const { token } = useParams<{ token: string }>()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [docTitle, setDocTitle] = useState('')
  const [docKind, setDocKind] = useState('Proof')
  const [uploadError, setUploadError] = useState('')
  const [msgError, setMsgError] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-share', token],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/public/share/${token}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Link inválido ou expirado')
      }
      return res.json() as Promise<PortalData>
    },
    enabled: !!token,
    retry: false,
    refetchInterval: 12_000,
  })

  const sendMessage = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/public/share/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: message, authorName: authorName || undefined }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Falha ao enviar')
      }
      return res.json()
    },
    onSuccess: () => {
      setMessage('')
      setMsgError('')
      void qc.invalidateQueries({ queryKey: ['public-share', token] })
    },
    onError: (e: Error) => setMsgError(e.message),
  })

  const uploadFile = async (file: File | null) => {
    if (!file || !token) return
    setUploadError('')
    const form = new FormData()
    form.append('file', file)
    form.append('title', docTitle || file.name)
    form.append('kind', docKind)
    if (authorName) form.append('uploaderLabel', authorName)
    const res = await fetch(`${API_BASE}/public/share/${token}/documents`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setUploadError(err.detail || 'Falha no envio')
      return
    }
    setDocTitle('')
    void qc.invalidateQueries({ queryKey: ['public-share', token] })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white">
        <LoadingSpinner label="Abrindo seu espaço…" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 p-4">
        <EmptyState
          title="Link inválido ou expirado"
          description="Peça um novo link à sua assistente."
        />
      </div>
    )
  }

  const caps = data.capabilities || {}

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-ink-50">
      <header className="border-b border-brand-900/10 bg-brand-900 px-4 py-5 text-white">
        <div className="mx-auto flex max-w-lg items-start gap-3">
          <BrandLogo size={48} className="mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-100/80">
              {data.brand || 'Fatto Virtual'} · área do contratante
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {data.client?.name || 'Seu acompanhamento'}
            </h1>
            {data.client?.companyName && (
              <p className="text-sm text-brand-100/90">{data.client.companyName}</p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-5 pb-24">
        {data.client && (
          <Card className="border-0 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-900">
                {data.client.status || 'Ativo'}
              </span>
              {data.client.relationshipStage && (
                <span className="text-xs text-ink-500">{data.client.relationshipStage}</span>
              )}
            </div>
            {data.client.nextAction ? (
              <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Próximo passo
                </p>
                <p className="mt-0.5 font-medium">{data.client.nextAction}</p>
                {data.client.nextActionAtUtc && (
                  <p className="text-xs text-amber-800/80">
                    {new Date(data.client.nextActionAtUtc).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-600">
                Acompanhe aqui mensagens, documentos e o andamento com a equipe.
              </p>
            )}
          </Card>
        )}

        {caps.canViewFinance && data.finance && (
          <Card>
            <h2 className="font-semibold text-ink-900">Financeiro com a operação</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-emerald-50 px-3 py-2">
                <p className="text-xs text-emerald-800">Pago</p>
                <p className="font-semibold text-emerald-900">{money(data.finance.paidTotal)}</p>
              </div>
              <div className="rounded-xl bg-orange-50 px-3 py-2">
                <p className="text-xs text-orange-800">Pendente</p>
                <p className="font-semibold text-orange-900">{money(data.finance.pendingTotal)}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {data.finance.items.slice(0, 6).map((p, i) => (
                <li key={i} className="flex justify-between text-sm text-ink-700">
                  <span className="truncate pr-2">{p.description}</span>
                  <span className="shrink-0 font-medium">
                    {money(p.amount)} · {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {caps.canViewAgenda && !!data.agenda?.length && (
          <Card>
            <h2 className="font-semibold text-ink-900">Próximos compromissos</h2>
            <ul className="mt-2 space-y-2">
              {data.agenda.map((e, i) => (
                <li key={i} className="rounded-lg bg-ink-50 px-3 py-2 text-sm">
                  <p className="font-medium text-ink-900">{e.title}</p>
                  <p className="text-xs text-ink-500">
                    {new Date(e.startAt).toLocaleString('pt-BR')}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {caps.canViewContracts && !!data.contracts?.length && (
          <Card>
            <h2 className="font-semibold text-ink-900">Contratos</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {data.contracts.map((c, i) => (
                <li key={i} className="flex justify-between border-b border-ink-50 py-2">
                  <span>{c.name}</span>
                  <span className="text-ink-500">{c.status}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {caps.canUpload && (
          <Card>
            <h2 className="font-semibold text-ink-900">Enviar documento ou foto</h2>
            <p className="mt-1 text-xs text-ink-500">
              Comprovante, contrato ou foto da câmera — direto do celular.
            </p>
            <div className="mt-3 space-y-2">
              <Input
                label="Seu nome (opcional)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Como a equipe deve te reconhecer"
              />
              <Input
                label="Título do arquivo"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Ex.: Comprovante mês 08"
              />
              <label className="block text-sm font-medium text-ink-700">Tipo</label>
              <select
                className="w-full rounded-xl border border-ink-300 px-3 py-2.5 text-sm"
                value={docKind}
                onChange={(e) => setDocKind(e.target.value)}
              >
                <option value="Proof">Comprovante</option>
                <option value="Document">Documento</option>
                <option value="Photo">Foto</option>
                <option value="Other">Outro</option>
              </select>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => cameraRef.current?.click()}
                >
                  Tirar foto
                </Button>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => fileRef.current?.click()}
                >
                  Arquivo / galeria
                </Button>
              </div>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => void uploadFile(e.target.files?.[0] ?? null)}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => void uploadFile(e.target.files?.[0] ?? null)}
              />
              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            </div>
            {!!data.documents?.length && (
              <ul className="mt-4 space-y-2 border-t border-ink-100 pt-3">
                {data.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-900">{d.title}</p>
                      <p className="text-xs text-ink-500">
                        {d.kind} · {d.uploaderLabel || d.uploadedBy} ·{' '}
                        {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <a
                      href={`${API_BASE}/public/share/${token}/documents/${d.id}`}
                      className="shrink-0 text-xs font-semibold text-brand-800 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {caps.canMessage && (
          <Card>
            <h2 className="font-semibold text-ink-900">Falar com a equipe</h2>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {(data.messages || []).length === 0 && (
                <p className="text-sm text-ink-500">Nenhuma mensagem ainda. Envie a primeira.</p>
              )}
              {(data.messages || []).map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                    m.fromContractor
                      ? 'ml-auto bg-brand-800 text-white'
                      : 'bg-ink-50 text-ink-900'
                  }`}
                >
                  <p className="text-[10px] font-semibold opacity-70">{m.authorLabel}</p>
                  <p>{m.body}</p>
                  <p className="mt-1 text-[10px] opacity-60">
                    {new Date(m.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <Textarea
                label="Mensagem"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Dúvida, comprovante enviado, pedido…"
                className="min-h-[80px]"
              />
              {msgError && <p className="text-xs text-red-600">{msgError}</p>}
              <Button
                className="w-full"
                disabled={!message.trim() || sendMessage.isPending}
                onClick={() => sendMessage.mutate()}
              >
                Enviar mensagem
              </Button>
            </div>
          </Card>
        )}

        {!!data.faqs?.length && (
          <Card>
            <h2 className="font-semibold text-ink-900">Dúvidas frequentes</h2>
            <ul className="mt-2 space-y-3">
              {data.faqs.map((f, i) => (
                <li key={i}>
                  <p className="text-sm font-medium text-ink-900">{f.question}</p>
                  <p className="text-sm text-ink-600">{f.answer}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </div>
  )
}

/** @deprecated use ContractorPortalPage */
export const PublicSharePage = ContractorPortalPage
