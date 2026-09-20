import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { api } from '../../shared/api/client'
import type { ActiveClientPaymentTask, Payment } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import { useAuth } from '../../shared/auth/AuthContext'
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSpinner,
  MobileHero,
  MobileRow,
  MobileSection,
  MobileStat,
  MobileTip,
  Modal,
  PageHeader,
  Select,
  formatMoneyBr,
} from '../../shared/ui'
import { ArrowDownRight, ArrowUpRight, CalendarDays, CreditCard, Wallet } from 'lucide-react'
import { SettlePaymentModal } from './SettlePaymentModal'
import {
  EntityLinksField,
  PaymentLinksChips,
  linksToApi,
} from './EntityLinksField'
import type { PaymentLink } from '../../shared/types'

type Ledger = 'Agency' | 'ClientAr' | 'ClientAp' | 'AssistantPayout' | 'all'

function money(value?: number) {
  return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ledgerLabel(l?: string) {
  if (l === 'ClientAr') return 'Cliente ← terceiro'
  if (l === 'ClientAp') return 'Cliente → fornecedor'
  if (l === 'AssistantPayout') return 'Fatto → VA'
  return 'Fatto ← cliente'
}

function AddPaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [error, setError] = useState('')
  const [links, setLinks] = useState<PaymentLink[]>([])
  const [form, setForm] = useState({
    amount: '',
    description: '',
    clientId: '',
    dueDate: '',
    ledger: 'Agency',
    counterpartyName: '',
    category: '',
    isSettled: false,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/clients'),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/payments', {
        amount: parseFloat(form.amount),
        description:
          form.description ||
          (form.ledger === 'Agency'
            ? 'Recebimento Fatto'
            : form.ledger === 'ClientAr'
              ? 'Recebível do cliente'
              : form.ledger === 'AssistantPayout'
                ? 'Repasse VA'
                : 'Pagável do cliente'),
        clientId: form.clientId || null,
        ledger: form.ledger,
        counterpartyName: form.counterpartyName || null,
        category: form.category || null,
        dueAt: form.dueDate ? `${form.dueDate}T12:00:00.000Z` : null,
        isSettled: form.isSettled,
        links: linksToApi(links),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payments'] })
      void qc.invalidateQueries({ queryKey: ['finance-tasks'] })
      setError('')
      setLinks([])
      setForm({
        amount: '',
        description: '',
        clientId: '',
        dueDate: '',
        ledger: form.ledger,
        counterpartyName: '',
        category: '',
        isSettled: false,
      })
      onClose()
    },
    onError: (e: Error) => setError(e.message || 'Falha ao salvar'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Registrar movimento" size="lg">
      <div className="space-y-4">
        <p className="text-xs text-ink-500">
          Três gavetas: negócio do cliente (A), o que a Fatto cobra (B) e o que a Fatto paga à VA (C).
          O cliente nunca vê a gaveta C.
        </p>
        <Select
          label="Livro"
          value={form.ledger}
          onChange={(e) => setForm({ ...form, ledger: e.target.value })}
        >
          <option value="Agency">B · Fatto ← cliente</option>
          <option value="ClientAr">A · Cliente ← terceiros</option>
          <option value="ClientAp">A · Cliente → fornecedores</option>
          <option value="AssistantPayout">C · Fatto → VA (oculto do cliente)</option>
        </Select>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Input
            label="Vencimento"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <Select
            label="Cliente"
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          >
            <option value="">— Sem cliente —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Categoria"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Mensalidade, NF, taxa…"
          />
        </div>
        {form.ledger !== 'Agency' && form.ledger !== 'AssistantPayout' && (
          <Input
            label={form.ledger === 'ClientAr' ? 'Quem paga (terceiro)' : 'Fornecedor / terceiro'}
            value={form.counterpartyName}
            onChange={(e) => setForm({ ...form, counterpartyName: e.target.value })}
          />
        )}
        <Input
          label="Descrição"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Opcional — geramos um título se vazio"
        />
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={form.isSettled}
            onChange={(e) => setForm({ ...form, isSettled: e.target.checked })}
          />
          Já está pago / baixado
        </label>
        <EntityLinksField
          value={links}
          onChange={setLinks}
          clientId={form.clientId || null}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!form.amount || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function FinancePage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canManageAll = hasPermission(Permissions.FinanceAll)
  const [showAdd, setShowAdd] = useState(false)
  const [settleId, setSettleId] = useState<string | null>(null)
  const [ledgerFilter, setLedgerFilter] = useState<Ledger>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Paid'>('all')
  const [q, setQ] = useState('')
  const qc = useQueryClient()

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', user?.isOwner],
    queryFn: () => api.get<Payment[]>(canManageAll ? '/payments' : '/payments/mine'),
  })

  const { data: tasks = [] } = useQuery({
    queryKey: ['finance-tasks'],
    queryFn: () => api.get<ActiveClientPaymentTask[]>('/finance/active-client-tasks'),
    enabled: canManageAll,
  })

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return payments.filter((p) => {
      const ledger = p.ledger || 'Agency'
      if (ledgerFilter !== 'all' && ledger !== ledgerFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (
        term &&
        !`${p.description || ''} ${p.clientName || ''} ${p.counterpartyName || ''} ${p.category || ''}`
          .toLowerCase()
          .includes(term)
      ) {
        return false
      }
      return true
    })
  }, [payments, ledgerFilter, statusFilter, q])

  const totals = useMemo(() => {
    const of = (ledger: string) => payments.filter((p) => (p.ledger || 'Agency') === ledger)
    const sum = (list: Payment[], settled: boolean) =>
      list.filter((p) => (settled ? p.status === 'Paid' : p.status === 'Pending')).reduce((a, p) => a + p.amount, 0)
    return {
      agencyPaid: sum(of('Agency'), true),
      agencyPending: sum(of('Agency'), false),
      arPaid: sum(of('ClientAr'), true),
      arPending: sum(of('ClientAr'), false),
      apPaid: sum(of('ClientAp'), true),
      apPending: sum(of('ClientAp'), false),
      payoutPaid: sum(of('AssistantPayout'), true),
      payoutPending: sum(of('AssistantPayout'), false),
    }
  }, [payments])

  const settleTarget = payments.find((p) => p.id === settleId)
  const pendingTasks = tasks.filter((t) => !t.hasPaymentThisMonth)

  if (isLoading) return <LoadingSpinner />

  const income = totals.agencyPaid + totals.arPaid
  const expense = totals.apPaid + totals.payoutPaid
  const profit = income - expense
  const incoming = totals.agencyPending + totals.arPending
  const nextPay = payments
    .filter((p) => p.status === 'Pending')
    .sort((a, b) => +new Date(a.dueDate || 0) - +new Date(b.dueDate || 0))[0]
  const recent = [...payments]
    .sort((a, b) => +new Date(b.paidAt || b.dueDate || 0) - +new Date(a.paidAt || a.dueDate || 0))
    .slice(0, 5)

  return (
    <div>
      <div className="mona-mobile-only mona-m-stack">
        <MobileHero
          kicker={`${new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, ${user?.name?.split(' ')[0] || 'por aqui'}!`}
          title="Seu financeiro em dia, sempre"
          lead="Acompanhe receitas, despesas e o que o negócio ainda precisa receber."
          cta={canManageAll ? { to: '/relatorios', label: 'Ver relatório' } : undefined}
          note="Mais controle para ir longe"
        />
        <div className="mona-m-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <MobileStat icon={ArrowUpRight} label="Receitas" value={formatMoneyBr(income)} hint="baixado" tone="mint" />
          <MobileStat icon={ArrowDownRight} label="Despesas" value={formatMoneyBr(expense)} hint="baixado" tone="rose" />
          <MobileStat icon={Wallet} label="Lucro" value={formatMoneyBr(profit)} hint="no recorte" tone="purple" />
          <MobileStat icon={CreditCard} label="A receber" value={formatMoneyBr(incoming)} hint="pendente" tone="orange" />
        </div>
        {nextPay && (
          <MobileRow
            to="/financeiro"
            icon={<span className="mona-m-icon"><CalendarDays size={16} /></span>}
            title={nextPay.description || 'Próximo pagamento'}
            meta={nextPay.dueDate ? new Date(nextPay.dueDate).toLocaleDateString('pt-BR') : 'Sem vencimento'}
            trailing={<span className="mona-m-badge">{formatMoneyBr(nextPay.amount)}</span>}
          />
        )}
        <MobileSection title="Últimas movimentações" action={{ to: '/financeiro', label: 'Ver todas' }}>
          <div className="mona-m-list">
            {recent.map((p) => (
              <MobileRow
                key={p.id}
                title={p.description || ledgerLabel(p.ledger)}
                meta={p.clientName || p.category || ledgerLabel(p.ledger)}
                trailing={
                  <strong style={{ color: p.ledger === 'ClientAp' || p.ledger === 'AssistantPayout' ? 'var(--mona-color-pink)' : 'var(--mona-color-purple)' }}>
                    {p.ledger === 'ClientAp' || p.ledger === 'AssistantPayout' ? '-' : ''}
                    {formatMoneyBr(p.amount)}
                  </strong>
                }
              />
            ))}
            {recent.length === 0 && <EmptyState title="Nenhuma movimentação" />}
          </div>
        </MobileSection>
        <MobileTip to="/relatorios">Separe o que já entrou do que ainda está pendente antes de decidir o mês.</MobileTip>
      </div>

      <div className="mona-desktop-only">
      <PageHeader
        title={canManageAll ? 'Financeiro' : 'Meu financeiro'}
        subtitle="Gavetas separadas: negócio do cliente, mensalidade da Fatto e repasse da VA."
        actions={
          canManageAll && (
            <Button onClick={() => setShowAdd(true)}>Registrar movimento</Button>
          )
        }
      />

      {canManageAll && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-xs font-semibold uppercase text-ink-500">Fatto ← cliente</p>
            <p className="mt-1 text-lg font-semibold text-emerald-700">{money(totals.agencyPaid)}</p>
            <p className="text-xs text-orange-700">A receber {money(totals.agencyPending)}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase text-ink-500">Cliente ← terceiros</p>
            <p className="mt-1 text-lg font-semibold text-emerald-700">{money(totals.arPaid)}</p>
            <p className="text-xs text-orange-700">A receber {money(totals.arPending)}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase text-ink-500">Cliente → fornecedores</p>
            <p className="mt-1 text-lg font-semibold text-ink-800">{money(totals.apPaid)}</p>
            <p className="text-xs text-orange-700">A pagar {money(totals.apPending)}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase text-ink-500">C · Fatto → VA</p>
            <p className="mt-1 text-lg font-semibold text-ink-800">{money(totals.payoutPaid)}</p>
            <p className="text-xs text-orange-700">A pagar {money(totals.payoutPending)}</p>
            <p className="mt-1 text-xs text-ink-500">Margem {money(totals.agencyPaid - totals.payoutPaid)}</p>
          </Card>
        </div>
      )}

      {canManageAll && pendingTasks.length > 0 && (
        <Card className="mb-4 border-orange-100 bg-orange-50/40">
          <h2 className="mb-2 text-sm font-semibold text-ink-900">
            Clientes ativos sem registro Fatto neste mês ({pendingTasks.length})
          </h2>
          <ul className="flex flex-wrap gap-2">
            {pendingTasks.slice(0, 12).map((t) => (
              <li key={t.clientId}>
                <Link
                  to={`/clientes/${t.clientId}`}
                  className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-orange-900 ring-1 ring-orange-200 hover:bg-orange-50"
                >
                  {t.clientName}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Buscar descrição, cliente, terceiro…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[220px] flex-1"
        />
        <Select
          value={ledgerFilter}
          onChange={(e) => setLedgerFilter(e.target.value as Ledger)}
          className="min-w-[180px]"
        >
          <option value="all">Todos os livros</option>
          <option value="Agency">B · Fatto ← cliente</option>
          <option value="ClientAr">A · Cliente ← terceiros</option>
          <option value="AssistantPayout">C · Fatto → VA</option>
          <option value="ClientAp">Cliente → fornecedores</option>
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="min-w-[140px]"
        >
          <option value="all">Todos status</option>
          <option value="Pending">Pendentes</option>
          <option value="Paid">Baixados</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum movimento neste filtro" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-ink-800">Descrição</th>
                <th className="px-4 py-3 font-medium text-ink-800">Livro</th>
                <th className="px-4 py-3 font-medium text-ink-800">Cliente / terceiro</th>
                <th className="px-4 py-3 font-medium text-ink-800">Venc.</th>
                <th className="px-4 py-3 font-medium text-ink-800">Valor</th>
                <th className="px-4 py-3 font-medium text-ink-800">Status</th>
                <th className="px-4 py-3 font-medium text-ink-800">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-ink-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{p.description || '—'}</p>
                    {p.category && <p className="text-xs text-ink-500">{p.category}</p>}
                    <PaymentLinksChips links={p.links} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-600">{ledgerLabel(p.ledger)}</td>
                  <td className="px-4 py-3">
                    {p.clientId ? (
                      <Link to={`/clientes/${p.clientId}`} className="text-brand-800 hover:underline">
                        {p.clientName || 'Cliente'}
                      </Link>
                    ) : (
                      '—'
                    )}
                    {p.counterpartyName && (
                      <p className="text-xs text-ink-500">{p.counterpartyName}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {p.dueDate ? new Date(p.dueDate).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium">{money(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {p.status === 'Paid' ? 'Baixado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.status === 'Pending' && canManageAll && (
                        <Button size="sm" variant="secondary" onClick={() => setSettleId(p.id)}>
                          Dar baixa
                        </Button>
                      )}
                      {p.clientId && (
                        <Link to={`/clientes/${p.clientId}`}>
                          <Button size="sm" variant="ghost">
                            Ficha
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      </div>
      <AddPaymentModal open={showAdd} onClose={() => setShowAdd(false)} />
      <SettlePaymentModal
        open={!!settleId}
        paymentId={settleId}
        label={
          settleTarget
            ? `${settleTarget.description || 'Movimento'} · ${money(settleTarget.amount)}`
            : undefined
        }
        onClose={() => setSettleId(null)}
        onSettled={() => {
          void qc.invalidateQueries({ queryKey: ['payments'] })
          void qc.invalidateQueries({ queryKey: ['client'] })
          void qc.invalidateQueries({ queryKey: ['finance-tasks'] })
        }}
      />
    </div>
  )
}
