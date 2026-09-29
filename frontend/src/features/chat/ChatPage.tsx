import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, NotebookPen, Users } from 'lucide-react'
import chatIllustration from '../../assets/illustrations/chat.png'
import { api } from '../../shared/api/client'
import { Button, Card, Checkbox, EmptyState, Input, LoadingSpinner, PageHeader, Select } from '../../shared/ui'

type Peer = { id: string; name: string; email?: string; isSelf?: boolean }
type Thread = {
  id: string
  title: string
  lastMessage?: string
  lastAt: string
  isSelf?: boolean
  isGroup?: boolean
  isDirect?: boolean
  participants: { userId: string; name: string }[]
}
type Message = {
  id: string
  body: string
  authorName: string
  createdAt: string
  mine: boolean
  attachmentKind?: string
  attachmentId?: string
  attachmentLabel?: string
  attachmentPath?: string
}

type AttachKind = 'none' | 'todo' | 'agenda' | 'client' | 'service'

export function ChatPage() {
  const qc = useQueryClient()
  const [threadId, setThreadId] = useState('')
  const [peerId, setPeerId] = useState('')
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [groupTitle, setGroupTitle] = useState('')
  const [text, setText] = useState('')
  const [attachKind, setAttachKind] = useState<AttachKind>('none')
  const [attachId, setAttachId] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: peers = [] } = useQuery({
    queryKey: ['chat-peers'],
    queryFn: () => api.get<Peer[]>('/chat/peers'),
  })

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['chat-threads'],
    queryFn: () => api.get<Thread[]>('/chat/threads'),
    refetchInterval: 10_000,
  })

  const activeId = threadId || threads[0]?.id || ''

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', activeId],
    queryFn: () => api.get<Message[]>(`/chat/threads/${activeId}/messages`),
    enabled: !!activeId,
    refetchInterval: 4_000,
  })

  const loadAttach = attachKind !== 'none'
  const { data: attachOptions = [] } = useQuery({
    queryKey: ['chat-attach', attachKind],
    queryFn: async () => {
      if (attachKind === 'todo') {
        const rows = await api.get<{ id: string; title: string }[]>('/todos')
        return rows.map((r) => ({ id: r.id, label: r.title }))
      }
      if (attachKind === 'agenda') {
        const rows = await api.get<{ id: string; title: string }[]>('/agenda/events')
        return rows.map((r) => ({ id: r.id, label: r.title }))
      }
      if (attachKind === 'client') {
        const rows = await api.get<{ id: string; name: string }[]>('/clients')
        return rows.map((r) => ({ id: r.id, label: r.name }))
      }
      if (attachKind === 'service') {
        const rows = await api.get<{ id: string; title: string }[]>('/services')
        return rows.map((r) => ({ id: r.id, label: r.title }))
      }
      return [] as { id: string; label: string }[]
    },
    enabled: loadAttach,
  })

  useEffect(() => {
    const scroller = bottomRef.current?.parentElement
    if (scroller) scroller.scrollTop = scroller.scrollHeight
  }, [messages.length])

  useEffect(() => {
    setAttachId('')
  }, [attachKind])

  const createDirect = useMutation({
    mutationFn: () => api.post<{ id: string }>('/chat/threads', { peerUserId: peerId }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['chat-threads'] })
      setThreadId(data.id)
      setPeerId('')
    },
  })

  const createSelf = useMutation({
    mutationFn: () => api.post<{ id: string }>('/chat/threads', { self: true }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['chat-threads'] })
      setThreadId(data.id)
    },
  })

  const createGroup = useMutation({
    mutationFn: () =>
      api.post<{ id: string }>('/chat/threads', {
        isGroup: true,
        title: groupTitle || undefined,
        participantUserIds: groupIds,
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['chat-threads'] })
      setThreadId(data.id)
      setGroupIds([])
      setGroupTitle('')
    },
  })

  const send = useMutation({
    mutationFn: () =>
      api.post(`/chat/threads/${activeId}/messages`, {
        body: text || undefined,
        attachmentKind: attachKind === 'none' ? undefined : attachKind,
        attachmentId: attachKind !== 'none' && attachId ? attachId : undefined,
      }),
    onSuccess: () => {
      setText('')
      setAttachKind('none')
      setAttachId('')
      void qc.invalidateQueries({ queryKey: ['chat-messages', activeId] })
      void qc.invalidateQueries({ queryKey: ['chat-threads'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const others = peers.filter((p) => !p.isSelf)
  const canSend = !!activeId && (!!text.trim() || (attachKind !== 'none' && !!attachId))

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="mona-chat-workspace">
      <PageHeader
        title="Chat interno"
        subtitle="Direto, grupos, notas consigo e envio de tarefas, agenda, clientes e serviços — com ACL."
        illustration={chatIllustration}
      />

      <div className="mona-chat-workspace__create">
        <div className="flex flex-wrap items-end gap-2">
          <Select
            label="Conversa direta"
            value={peerId}
            onChange={(e) => setPeerId(e.target.value)}
            className="min-w-[200px]"
          >
            <option value="">Selecione atendente</option>
            {others.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Button disabled={!peerId || createDirect.isPending} onClick={() => createDirect.mutate()}>
            Iniciar
          </Button>
          <Button variant="secondary" onClick={() => createSelf.mutate()} disabled={createSelf.isPending}>
            Chat consigo
          </Button>
        </div>

        <details className="mona-chat-workspace__group">
          <summary>Novo grupo</summary>
          <div className="flex flex-wrap items-end gap-2 pt-3">
            <Input
              label="Nome do grupo (opcional)"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              className="min-w-[180px]"
            />
            <div className="min-w-[220px] flex-1">
              <p className="mb-1.5 text-sm font-medium text-ink-700">Participantes</p>
              <div className="max-h-28 space-y-1 overflow-y-auto rounded-xl border border-ink-200 px-2 py-1.5">
                {others.map((p) => {
                  const checked = groupIds.includes(p.id)
                  return (
                    <Checkbox
                      key={p.id}
                      label={p.name}
                      checked={checked}
                      onChange={() =>
                        setGroupIds((prev) =>
                          checked ? prev.filter((id) => id !== p.id) : [...prev, p.id],
                        )
                      }
                    />
                  )
                })}
                {others.length === 0 && (
                  <p className="py-2 text-xs text-ink-500">Cadastre usuários em Configurações.</p>
                )}
              </div>
            </div>
            <Button
              disabled={groupIds.length === 0 || createGroup.isPending}
              onClick={() => createGroup.mutate()}
            >
              Criar grupo
            </Button>
          </div>
        </details>
      </div>

      <div className="mona-chat-workspace__columns">
        <Card className="mona-chat-workspace__threads">
          <p className="mona-chat-workspace__label">Conversas <span>{threads.length}</span></p>
          <ul className="space-y-1">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setThreadId(t.id)}
                  className={`mona-chat-workspace__thread ${activeId === t.id ? 'is-active' : ''}`}
                >
                  <span className="mona-chat-workspace__thread-icon">{t.isSelf ? <NotebookPen size={17} /> : t.isGroup ? <Users size={17} /> : <MessageCircle size={17} />}</span>
                  <span className="mona-chat-workspace__thread-copy"><strong>{t.title}</strong><small>{t.lastMessage || 'Sem mensagens'}</small></span>
                </button>
              </li>
            ))}
            {threads.length === 0 && (
              <li className="mona-chat-workspace__no-threads">Nenhuma conversa ainda</li>
            )}
          </ul>
        </Card>

        <Card className="mona-chat-workspace__conversation">
          {!activeId ? (
            <EmptyState
              title="Comece uma conversa"
              description="Selecione um colega, crie um grupo ou guarde uma nota para você."
              illustration={chatIllustration}
              action={<Button variant="secondary" onClick={() => createSelf.mutate()} disabled={createSelf.isPending}>Criar nota pessoal</Button>}
            />
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {messages.length === 0 && (
                  <EmptyState title="Ainda não há mensagens" description="Escreva a primeira mensagem nesta conversa." illustration={chatIllustration} />
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.mine ? 'ml-auto bg-brand-800 text-white' : 'bg-ink-50 text-ink-900'
                    }`}
                  >
                    {!m.mine && <p className="text-[11px] font-semibold opacity-70">{m.authorName}</p>}
                    <p>{m.body}</p>
                    {m.attachmentKind && m.attachmentKind !== 'none' && m.attachmentLabel && (
                      <div
                        className={`mt-2 rounded-lg px-2 py-1.5 text-xs ${
                          m.mine ? 'bg-white/15' : 'bg-white border border-ink-100'
                        }`}
                      >
                        <p className="font-semibold">
                          {m.attachmentKind}: {m.attachmentLabel}
                        </p>
                        {m.attachmentPath && (
                          <Link
                            to={m.attachmentPath}
                            className={`underline ${m.mine ? 'text-white' : 'text-brand-800'}`}
                          >
                            Abrir
                          </Link>
                        )}
                      </div>
                    )}
                    <p className={`mt-1 text-[10px] ${m.mine ? 'text-white/70' : 'text-ink-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="space-y-2 border-t border-ink-100 p-3">
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={attachKind}
                    onChange={(e) => setAttachKind(e.target.value as AttachKind)}
                    className="min-w-[140px] text-xs"
                  >
                    <option value="none">Sem anexo</option>
                    <option value="todo">Tarefa</option>
                    <option value="agenda">Agenda</option>
                    <option value="client">Cliente</option>
                    <option value="service">Serviço</option>
                  </Select>
                  {attachKind !== 'none' && (
                    <Select
                      value={attachId}
                      onChange={(e) => setAttachId(e.target.value)}
                      className="min-w-[180px] flex-1 text-xs"
                    >
                      <option value="">Escolher…</option>
                      {attachOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
                <div className="mona-chat-workspace__composer">
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escreva… (pode anexar tarefa/agenda)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canSend) send.mutate()
                    }}
                  />
                  <Button className="w-full sm:w-auto" disabled={!canSend || send.isPending} onClick={() => send.mutate()}>
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
