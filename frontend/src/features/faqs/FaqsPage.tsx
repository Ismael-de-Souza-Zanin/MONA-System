import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { api } from '../../shared/api/client'
import type { FaqItem } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
  Textarea,
} from '../../shared/ui'

function FaqFormModal({
  open,
  onClose,
  item,
}: {
  open: boolean
  onClose: () => void
  item?: FaqItem | null
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    question: item?.question ?? '',
    answer: item?.answer ?? '',
    category: item?.category ?? '',
    isPublished: item?.isPublished ?? true,
  })

  const mutation = useMutation({
    mutationFn: () =>
      item
        ? api.put(`/faqs/${item.id}`, form)
        : api.post('/faqs', form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['faqs'] })
      onClose()
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={item ? 'Editar FAQ' : 'Nova FAQ'}>
      <div className="space-y-3">
        <Input
          label="Pergunta"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
        />
        <Textarea
          label="Resposta"
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
          rows={5}
        />
        <Input
          label="Categoria (opcional)"
          placeholder="Portal, Financeiro, Onboarding…"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <Checkbox
          checked={form.isPublished}
          onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          label="Publicada (visível no portal e para a equipe)"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!form.question.trim() || !form.answer.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function FaqsPage() {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.FaqsWrite)
  const qc = useQueryClient()
  const [edit, setEdit] = useState<FaqItem | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => api.get<FaqItem[]>('/faqs'),
  })

  const grouped = useMemo(() => {
    const map = new Map<string, FaqItem[]>()
    for (const f of faqs) {
      const key = f.category?.trim() || 'Geral'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return [...map.entries()]
  }, [faqs])

  const reorder = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      api.put('/faqs/reorder', items),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['faqs'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/faqs/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['faqs'] }),
  })

  function move(id: string, dir: -1 | 1) {
    const ordered = [...faqs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    const idx = ordered.findIndex((f) => f.id === id)
    const swap = idx + dir
    if (idx < 0 || swap < 0 || swap >= ordered.length) return
    ;[ordered[idx], ordered[swap]] = [ordered[swap], ordered[idx]]
    reorder.mutate(ordered.map((f, i) => ({ id: f.id, sortOrder: i + 1 })))
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Perguntas frequentes"
        subtitle="Cada empresa organiza as suas — publicadas aparecem no portal do contratante"
        actions={
          canWrite && (
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Nova FAQ
            </Button>
          )
        }
      />

      {faqs.length === 0 ? (
        <EmptyState
          title="Nenhuma FAQ cadastrada"
          description={canWrite ? 'Crie a primeira pergunta para a sua organização.' : undefined}
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
                {category}
              </h2>
              <div className="space-y-3">
                {items.map((faq) => (
                  <Card key={faq.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-ink-900">{faq.question}</h3>
                          {faq.isPublished === false && (
                            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
                              Rascunho
                            </span>
                          )}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600">{faq.answer}</p>
                      </div>
                      {canWrite && (
                        <div className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            className="rounded p-1 text-ink-500 hover:bg-ink-50"
                            onClick={() => move(faq.id, -1)}
                            aria-label="Subir"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1 text-ink-500 hover:bg-ink-50"
                            onClick={() => move(faq.id, 1)}
                            aria-label="Descer"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    {canWrite && (
                      <div className="mt-3 flex gap-3 text-sm">
                        <button
                          type="button"
                          className="text-brand-800 hover:underline"
                          onClick={() => setEdit(faq)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-red-700 hover:underline"
                          onClick={() => {
                            if (confirm('Excluir esta FAQ?')) remove.mutate(faq.id)
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <FaqFormModal open={showAdd} onClose={() => setShowAdd(false)} />
      <FaqFormModal open={!!edit} onClose={() => setEdit(null)} item={edit} />
    </div>
  )
}
