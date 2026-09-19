import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MessageSquare, Minus, X } from 'lucide-react'
import { api } from '../../shared/api/client'
import { Button, Input, Select } from '../../shared/ui'

type Peer = { id: string; name: string; email?: string; isSelf?: boolean }
type Thread = {
  id: string
  title: string
  lastMessage?: string
  lastAt: string
  isSelf?: boolean
  isGroup?: boolean
}
type Message = {
  id: string
  body: string
  authorName: string
  createdAt: string
  mine: boolean
  attachmentKind?: string
  attachmentLabel?: string
  attachmentPath?: string
}

type AttachKind = 'none' | 'todo' | 'agenda' | 'client' | 'service'

const OPEN_KEY = 'fatto_chat_widget_open'

export function ChatWidget() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(() => localStorage.getItem(OPEN_KEY) === '1')
  const [threadId, setThreadId] = useState('')
  const [peerId, setPeerId] = useState('')
  const [text, setText] = useState('')
  const [attachKind, setAttachKind] = useState<AttachKind>('none')
  const [attachId, setAttachId] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(OPEN_KEY, open ? '1' : '0')
  }, [open])

  const { data: peers = [] } = useQuery({
    queryKey: ['chat-peers'],
    queryFn: () => api.get<Peer[]>('/chat/peers'),
    enabled: open,
  })

  const { data: threads = [] } = useQuery({
    queryKey: ['chat-threads'],
    queryFn: () => api.get<Thread[]>('/chat/threads'),
    refetchInterval: open ? 8_000 : false,
    enabled: open,
  })

  const activeId = threadId || threads[0]?.id || ''

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', activeId],
    queryFn: () => api.get<Message[]>(`/chat/threads/${activeId}/messages`),
    enabled: open && !!activeId,
    refetchInterval: open ? 3_000 : false,
  })

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
    enabled: open && attachKind !== 'none',
  })

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, open, activeId])

  useEffect(() => {
    setAttachId('')
  }, [attachKind])

  const createThread = useMutation({
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
    },
  })

  const others = peers.filter((p) => !p.isSelf)
  const canSend = !!activeId && (!!text.trim() || (attachKind !== 'none' && !!attachId))

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mona-chat-fab fixed bottom-4 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl ring-4 ring-orange-400/20 transition hover:brightness-110"
        style={{ background: 'var(--mona-gradient-cta)' }}
        aria-label="Abrir chat interno"
        title="Chat interno"
      >
        <MessageSquare size={22} />
      </button>
    )
  }

  return (
    <div className="mona-chat-panel fixed bottom-4 right-4 z-[60] flex h-[min(560px,calc(100vh-5rem))] w-[min(400px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-2xl">
      <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2.5 text-white" style={{ background: 'var(--mona-gradient-cta)' }}>
        <MessageSquare size={16} />
        <p className="flex-1 text-sm font-semibold">Chat interno</p>
        <button
          type="button"
          className="rounded-lg p-1 hover:bg-white/10"
          title="Minimizar"
          onClick={() => setOpen(false)}
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          className="rounded-lg p-1 hover:bg-white/10"
          title="Fechar"
          onClick={() => setOpen(false)}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-ink-50 bg-ink-50/80 px-2 py-1.5">
        {threads.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setThreadId(t.id)}
            className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium ${
              activeId === t.id ? 'bg-white text-brand-900 shadow-sm' : 'text-ink-600 hover:bg-white/70'
            }`}
          >
            {t.isSelf ? '📝 ' : t.isGroup ? '👥 ' : ''}
            {t.title}
          </button>
        ))}
        {threads.length === 0 && (
          <span className="px-1 py-1 text-[11px] text-ink-500">Nenhuma conversa</span>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-1.5 border-b border-ink-50 px-2 py-2">
        <Select
          value={peerId}
          onChange={(e) => setPeerId(e.target.value)}
          className="min-w-0 flex-1 text-xs"
        >
          <option value="">Nova conversa…</option>
          {others.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Button size="sm" disabled={!peerId} onClick={() => createThread.mutate()}>
          Iniciar
        </Button>
        <Button size="sm" variant="secondary" onClick={() => createSelf.mutate()}>
          Consigo
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {!activeId ? (
          <p className="py-8 text-center text-xs text-ink-500">
            Conversa direta, consigo ou abra a página Chat para grupos.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.mine ? 'ml-auto bg-brand-800 text-white' : 'bg-ink-50 text-ink-900'
              }`}
            >
              {!m.mine && <p className="text-[10px] font-semibold opacity-70">{m.authorName}</p>}
              <p>{m.body}</p>
              {m.attachmentKind && m.attachmentKind !== 'none' && m.attachmentLabel && (
                <div
                  className={`mt-1.5 rounded-lg px-2 py-1 text-[11px] ${
                    m.mine ? 'bg-white/15' : 'border border-ink-100 bg-white'
                  }`}
                >
                  {m.attachmentLabel}
                  {m.attachmentPath && (
                    <>
                      {' · '}
                      <Link to={m.attachmentPath} className="underline">
                        Abrir
                      </Link>
                    </>
                  )}
                </div>
              )}
              <p className={`mt-1 text-[10px] ${m.mine ? 'text-white/70' : 'text-ink-400'}`}>
                {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-1.5 border-t border-ink-100 p-2">
        <div className="flex gap-1">
          <Select
            value={attachKind}
            onChange={(e) => setAttachKind(e.target.value as AttachKind)}
            className="min-w-0 flex-1 text-[11px]"
          >
            <option value="none">Anexo</option>
            <option value="todo">Tarefa</option>
            <option value="agenda">Agenda</option>
            <option value="client">Cliente</option>
            <option value="service">Serviço</option>
          </Select>
          {attachKind !== 'none' && (
            <Select
              value={attachId}
              onChange={(e) => setAttachId(e.target.value)}
              className="min-w-0 flex-[1.4] text-[11px]"
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
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mensagem…"
            disabled={!activeId}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSend) send.mutate()
            }}
          />
          <Button size="sm" disabled={!canSend} onClick={() => send.mutate()}>
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}
