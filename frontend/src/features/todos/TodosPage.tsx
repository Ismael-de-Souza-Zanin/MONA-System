import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../../shared/api/client'
import type { TodoItem } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import { useAuth } from '../../shared/auth/AuthContext'
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../../shared/ui'

type BoardColumn = {
  id: string
  name: string
  color: string
  sortOrder: number
  marksComplete: boolean
  count?: number
}

function TodoCard({
  todo,
  columns,
  onMove,
  onAddComment,
  onSchedule,
}: {
  todo: TodoItem
  columns: BoardColumn[]
  onMove: (id: string, boardColumnId: string) => void
  onAddComment: (todo: TodoItem) => void
  onSchedule: (todo: TodoItem) => void
}) {
  return (
    <Card className={`p-3 ${todo.isOverdue ? 'ring-1 ring-red-300' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-ink-900">{todo.title}</p>
        {todo.priority && todo.priority !== 'Normal' && (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
            {todo.priority}
          </span>
        )}
      </div>
      {todo.description && (
        <p className="mt-1 line-clamp-2 text-xs text-ink-600">{todo.description}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1 text-xs text-ink-500">
        {todo.ownerUserName && <span>{todo.ownerUserName}</span>}
        {todo.clientName && <span>· {todo.clientName}</span>}
        {todo.isGeneral && <span>· Geral</span>}
        {todo.dueAtLocal && (
          <span className={todo.isOverdue ? 'font-semibold text-red-700' : ''}>
            · prazo {new Date(todo.dueAtLocal).toLocaleString('pt-BR')}
            {todo.isOverdue ? ' · atrasada' : ''}
          </span>
        )}
        {todo.agendaEventTitle && <span>· agenda: {todo.agendaEventTitle}</span>}
      </div>
      {!!todo.tags?.length && (
        <div className="mt-2 flex flex-wrap gap-1">
          {todo.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-ink-50 px-2 py-0.5 text-[10px] text-ink-600">
              {tag}
            </span>
          ))}
        </div>
      )}
      {todo.comments?.length > 0 && (
        <p className="mt-2 text-xs text-ink-500">{todo.comments.length} comentário(s)</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        <Select
          value={todo.boardColumnId || ''}
          onChange={(e) => onMove(todo.id, e.target.value)}
          className="text-xs"
        >
          {columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Button size="sm" variant="ghost" onClick={() => onAddComment(todo)}>
          Comentar
        </Button>
        {!todo.agendaEventId && (
          <Button size="sm" variant="ghost" onClick={() => onSchedule(todo)}>
            Agendar
          </Button>
        )}
      </div>
    </Card>
  )
}

export function TodosPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canSeeAll = hasPermission(Permissions.TodosAll)
  const canWrite = hasPermission(Permissions.TodosWrite)
  const qc = useQueryClient()

  const [ownerFilter, setOwnerFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showColumns, setShowColumns] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [commentTodo, setCommentTodo] = useState<TodoItem | null>(null)
  const [commentText, setCommentText] = useState('')
  const [notifyOwner, setNotifyOwner] = useState(false)
  const [scheduleTodo, setScheduleTodo] = useState<TodoItem | null>(null)
  const [scheduleAt, setScheduleAt] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    isGeneral: true,
    clientId: '',
    dueAt: '',
    priority: 'Normal',
    tags: '',
    boardColumnId: '',
  })

  const { data: columns = [], isLoading: loadingCols } = useQuery({
    queryKey: ['todo-columns'],
    queryFn: () => api.get<BoardColumn[]>('/todo-board/columns'),
  })

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos', ownerFilter],
    queryFn: () =>
      api.get<TodoItem[]>(
        ownerFilter === 'all' && canSeeAll
          ? '/todos'
          : `/todos?ownerId=${ownerFilter === 'all' ? user?.id : ownerFilter}`,
      ),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['shared-users'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/shared-users'),
    enabled: canSeeAll,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/clients'),
    enabled: showAdd,
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, boardColumnId }: { id: string; boardColumnId: string }) =>
      api.patch(`/todos/${id}`, { boardColumnId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['todos'] })
      void qc.invalidateQueries({ queryKey: ['todo-columns'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/todos', {
        title: form.title,
        description: form.description,
        isGeneral: form.isGeneral,
        clientId: form.clientId || null,
        dueAt: form.dueAt || null,
        priority: form.priority,
        boardColumnId: form.boardColumnId || null,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['todos'] })
      void qc.invalidateQueries({ queryKey: ['todo-columns'] })
      setShowAdd(false)
      setForm({
        title: '',
        description: '',
        isGeneral: true,
        clientId: '',
        dueAt: '',
        priority: 'Normal',
        tags: '',
        boardColumnId: '',
      })
    },
  })

  const createColumn = useMutation({
    mutationFn: () => api.post('/todo-board/columns', { name: newColName }),
    onSuccess: () => {
      setNewColName('')
      void qc.invalidateQueries({ queryKey: ['todo-columns'] })
    },
  })

  const renameColumn = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.put(`/todo-board/columns/${id}`, { name }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['todo-columns'] }),
  })

  const deleteColumn = useMutation({
    mutationFn: (id: string) => api.delete(`/todo-board/columns/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['todo-columns'] })
      void qc.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const scheduleMutation = useMutation({
    mutationFn: () =>
      api.post(`/todos/${scheduleTodo!.id}/schedule`, {
        startAt: scheduleAt,
        title: scheduleTodo!.title,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['todos'] })
      void qc.invalidateQueries({ queryKey: ['agenda-events'] })
      setScheduleTodo(null)
      setScheduleAt('')
    },
  })

  const commentMutation = useMutation({
    mutationFn: () =>
      api.post(`/todos/${commentTodo!.id}/comments`, {
        content: commentText,
        notifyOwner,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['todos'] })
      setCommentTodo(null)
      setCommentText('')
      setNotifyOwner(false)
    },
  })

  const grouped = useMemo(() => {
    const map = new Map<string, TodoItem[]>()
    for (const c of columns) map.set(c.id, [])
    const fallback = columns[0]?.id
    for (const t of todos) {
      const key = t.boardColumnId && map.has(t.boardColumnId) ? t.boardColumnId : fallback
      if (!key) continue
      map.get(key)!.push(t)
    }
    return map
  }, [todos, columns])

  const overdueCount = todos.filter((t) => t.isOverdue).length

  if (isLoading || loadingCols) return <LoadingSpinner />

  return (
    <div className="min-w-0">
      <PageHeader
        title="Tarefas e demandas"
        subtitle="Quadro editável da equipe — prazos geram alertas; vincule cliente e agenda quando fizer sentido."
        actions={
          <div className="flex flex-wrap gap-2">
            {canWrite && (
              <Button variant="secondary" onClick={() => setShowColumns(true)}>
                <Pencil size={14} /> Colunas
              </Button>
            )}
            {canWrite && <Button onClick={() => setShowAdd(true)}>Nova task</Button>}
          </div>
        }
      />

      {overdueCount > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {overdueCount} tarefa(s) atrasada(s) — também aparecem em Alertas.
        </div>
      )}

      {canSeeAll && (
        <div className="mb-4">
          <Select
            label="Filtrar por responsável"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="max-w-xs"
          >
            <option value="all">Todos (equipe)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(220px, 1fr))`,
        }}
      >
        {columns.map((col) => {
          const items = grouped.get(col.id) || []
          return (
            <div key={col.id} className="min-w-0">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-700">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                {col.name} ({items.length})
              </h3>
              <div className="min-h-[200px] space-y-3">
                {items.length === 0 ? (
                  <EmptyState title="Vazio" />
                ) : (
                  items.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      columns={columns}
                      onMove={(id, boardColumnId) => moveMutation.mutate({ id, boardColumnId })}
                      onAddComment={setCommentTodo}
                      onSchedule={setScheduleTodo}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nova task">
        <div className="space-y-4">
          <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea
            label="Descrição"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Prazo"
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
          />
          <Select
            label="Coluna"
            value={form.boardColumnId}
            onChange={(e) => setForm({ ...form, boardColumnId: e.target.value })}
          >
            <option value="">Primeira coluna</option>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Cliente (opcional)"
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          >
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Tags (vírgula)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="urgente, fiscal, doc"
          />
          <Select
            label="Prioridade"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="Low">Baixa</option>
            <option value="Normal">Normal</option>
            <option value="High">Alta</option>
            <option value="Urgent">Urgente</option>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isGeneral}
              onChange={(e) => setForm({ ...form, isGeneral: e.target.checked })}
            />
            Visível para a equipe (geral)
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
            <Button disabled={!form.title} onClick={() => createMutation.mutate()}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showColumns} onClose={() => setShowColumns(false)} title="Editar colunas do quadro">
        <div className="space-y-4">
          <ul className="space-y-2">
            {columns.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-xl border border-ink-100 px-3 py-2"
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                <Input
                  className="flex-1"
                  defaultValue={c.name}
                  onBlur={(e) => {
                    const name = e.target.value.trim()
                    if (name && name !== c.name) renameColumn.mutate({ id: c.id, name })
                  }}
                />
                {c.marksComplete && (
                  <span className="text-[10px] uppercase text-emerald-700">conclui</span>
                )}
                <button
                  type="button"
                  className="rounded p-1 text-ink-400 hover:text-red-600"
                  title="Remover coluna"
                  onClick={() => {
                    if (columns.length <= 1) return
                    if (confirm(`Remover coluna "${c.name}"? Cards vão para a primeira coluna.`))
                      deleteColumn.mutate(c.id)
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              placeholder="Nova coluna…"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
            />
            <Button
              size="sm"
              disabled={!newColName.trim()}
              onClick={() => createColumn.mutate()}
            >
              <Plus size={14} /> Criar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!scheduleTodo} onClose={() => setScheduleTodo(null)} title="Criar evento na agenda">
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            Mantém a tarefa e cria um compromisso vinculado (contextos distintos, mesmo cliente).
          </p>
          <Input
            label="Início"
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setScheduleTodo(null)}>
              Cancelar
            </Button>
            <Button disabled={!scheduleAt} onClick={() => scheduleMutation.mutate()}>
              Agendar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!commentTodo} onClose={() => setCommentTodo(null)} title="Adicionar comentário">
        <div className="space-y-4">
          <Textarea
            label="Comentário"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <label className="flex items-center gap-2 rounded-lg bg-sand-50 p-3 text-sm">
            <input
              type="checkbox"
              checked={notifyOwner}
              onChange={(e) => setNotifyOwner(e.target.checked)}
            />
            Notificar o responsável da task?
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCommentTodo(null)}>
              Cancelar
            </Button>
            <Button disabled={!commentText} onClick={() => commentMutation.mutate()}>
              Enviar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
