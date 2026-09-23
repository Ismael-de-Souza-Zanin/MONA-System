import { useQuery } from '@tanstack/react-query'
import type { CSSProperties, ReactNode } from 'react'
import {
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  Hash,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Mail,
  MessageCircle,
  Settings,
  StickyNote,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { api } from '../../shared/api/client'
import type { ClientDetail } from '../../shared/types'
import { BrandLogo } from '../../shared/ui'
import todosCapture from './captures/todos.png'
import agendaCapture from './captures/agenda.png'
import financeiroCapture from './captures/financeiro.png'

function span(t: number, a: number, b: number) {
  return Math.min(1, Math.max(0, (t - a) / Math.max(0.0001, b - a)))
}

function fade(t: number, a: number, b: number, c: number, d: number) {
  if (t < a || t > d) return 0
  if (t < b) return span(t, a, b)
  if (t > c) return 1 - span(t, c, d)
  return 1
}

type LandStats = {
  activeClients?: number
  clients?: number
  paymentsPending?: number
  myTodos?: number
  agendaToday?: number
}

const TOUR_SCREENS = [
  { num: '1', label: 'Tarefas', src: todosCapture },
  { num: '2', label: 'Agenda', src: agendaCapture },
  { num: '3', label: 'Financeiro', src: financeiroCapture },
] as const

const PROCESS = [
  {
    num: '01',
    title: 'Onboarding',
    tone: 'purple',
    icon: UserPlus,
    items: ['Primeiro contato', 'Entendimento da operação', 'Configuração do ambiente'],
  },
  {
    num: '02',
    title: 'Execução',
    tone: 'rose',
    icon: Layers,
    items: ['Tarefas em andamento', 'Times alinhados', 'Processos integrados', 'Acompanhamento contínuo'],
  },
  {
    num: '03',
    title: 'Resultado',
    tone: 'orange',
    icon: TrendingUp,
    items: ['Metas alcançadas', 'Mais eficiência', 'Crescimento sustentável', 'Operação sob controle'],
  },
] as const

const CHAOS = [
  { x: 6, y: 8, rot: -12, kind: 'file', title: 'Notas.txt', icon: FileText },
  { x: 22, y: 4, rot: 8, kind: 'mail', title: '', icon: Mail },
  { x: 40, y: 12, rot: 6, kind: 'note', title: 'Revisar com o time?', icon: StickyNote },
  { x: 58, y: 6, rot: -7, kind: 'sheet', title: 'Planilha.xlsx', icon: BarChart3 },
  { x: 76, y: 14, rot: 5, kind: 'msg', title: 'Cliente\nPodemos ver isso hoje?', icon: MessageCircle },
  { x: 10, y: 36, rot: -6, kind: 'tasks', title: 'Tarefas', icon: CheckSquare },
  { x: 30, y: 40, rot: 4, kind: 'ideas', title: 'Ideias', icon: StickyNote },
  { x: 48, y: 34, rot: -8, kind: 'cal', title: 'MAR', icon: CalendarDays },
  { x: 68, y: 38, rot: 9, kind: 'folder', title: 'Projetos', icon: Folder },
  { x: 86, y: 32, rot: -4, kind: 'pdf', title: 'Briefing.pdf', icon: FileText },
  { x: 8, y: 68, rot: 10, kind: 'img', title: '', icon: ImageIcon },
  { x: 26, y: 74, rot: -10, kind: 'chart', title: '', icon: BarChart3 },
  { x: 52, y: 70, rot: 7, kind: 'file', title: 'Notas.txt', icon: FileText },
  { x: 74, y: 66, rot: -5, kind: 'note', title: 'Revisar com o time?', icon: StickyNote },
] as const

const ORDERED = [
  { title: 'Agenda organizada', icon: CalendarDays, hint: '' },
  { title: 'Clientes centralizados', icon: Users, hint: '' },
  { title: 'Arquivos sempre acessíveis', icon: Folder, hint: '' },
  { title: 'Resultados em evolução', icon: BarChart3, hint: 'chart' },
  { title: 'Tudo fluindo na MONA', icon: Check, hint: '' },
  { title: 'Comunicação no lugar certo', icon: MessageCircle, hint: '' },
  { title: 'Mais tempo para o que importa.', icon: CheckSquare, hint: 'cta' },
] as const

function money(value?: number, fallback = 12480) {
  return (value && value > 0 ? value : fallback).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function Scene({
  on,
  dim,
  className,
  style,
  children,
}: {
  on: number
  dim?: boolean
  className: string
  style?: CSSProperties
  children: ReactNode
}) {
  if (on < 0.03) return null
  return (
    <div
      className={`mona-scene ${className}${on > 0.08 ? ' is-on' : ''}${dim ? ' is-dim' : ''}`}
      style={{ opacity: on, ...style }}
      aria-hidden
    >
      {children}
    </div>
  )
}

export function LandingLive({ progress }: { progress: number }) {
  const { data: stats } = useQuery({
    queryKey: ['land-stats'],
    queryFn: () => api.get<LandStats>('/dashboard/stats', { skipAuth: true }),
  })
  const { data: client } = useQuery({
    queryKey: ['land-client'],
    queryFn: () => api.get<ClientDetail>('/clients/c-ana', { skipAuth: true }),
  })

  // Full session 05 tour after the crossing (Tarefas → Agenda → Financeiro).
  const tour = fade(progress, 0.49, 0.52, 0.64, 0.68)
  const clientIn = fade(progress, 0.66, 0.7, 0.74, 0.78)
  const path = fade(progress, 0.7, 0.74, 0.78, 0.82)
  const scan = fade(progress, 0.78, 0.82, 0.88, 0.92)
  const arch = fade(progress, 0.86, 0.9, 0.94, 0.98)
  const finale = fade(progress, 0.94, 0.97, 1, 1.05)
  const beam = span(progress, 0.79, 0.88)
  const slide = progress < 0.52 ? 0 : Math.min(2, span(progress, 0.52, 0.64) * 2)
  const focus = progress < 0.52 ? 0 : Math.min(2, Math.floor(span(progress, 0.52, 0.64) * 3))
  const showTourSides = slide > 0.08
  const name = client?.name || 'Ana Beatriz'
  const company = client?.companyName || 'Studio Lima'
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  const pending = client?.summary?.openTodos ?? stats?.myTodos ?? 3
  const received = client?.summary?.paidTotal ?? 12480

  return (
    <>
      <Scene on={tour} className="is-tour">
        <div className="mona-tour" style={{ '--slide': String(slide) } as CSSProperties}>
          <div className="mona-tour__track">
            {TOUR_SCREENS.map((screen, index) => (
              <article
                key={screen.label}
                className={`mona-tour__slide${index === focus ? ' is-on' : index < focus ? ' is-prev' : ' is-next'}${
                  !showTourSides && index !== 0 ? ' is-wait' : ''
                }`}
              >
                <p className="mona-tour__tag">
                  <span>{screen.num}</span> {screen.label}
                </p>
                <figure className="mona-tour__frame">
                  <img src={screen.src} alt="" />
                </figure>
              </article>
            ))}
          </div>
        </div>
        <div className="mona-tour__nav">
          <button type="button">
            <ChevronLeft size={14} />
          </button>
          {TOUR_SCREENS.map((screen, index) => (
            <i key={screen.label} className={index === focus ? 'is-on' : ''} />
          ))}
          <button type="button">
            <ChevronRight size={14} />
          </button>
        </div>
        <p className="mona-scene__note is-tour">Tudo o que você precisa em um só lugar.</p>
        <p className="mona-scene__foot">MONA — mais tempo para o que importa</p>
      </Scene>

      <Scene on={clientIn} className="is-client">
        <div className="mona-orbit">
          <article className="mona-sat is-visao">
            <p>
              <Users size={13} /> Visão
            </p>
            <strong>+32%</strong>
            <small>nos últimos 3 meses</small>
            <div className="mona-sat__bars">
              {[40, 55, 48, 70, 62, 88].map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </article>
          <article className="mona-sat is-tarefas">
            <p>
              <CheckSquare size={13} /> Tarefas
            </p>
            <ul>
              <li className="is-on" />
              <li className="is-on" />
              <li />
              <li />
            </ul>
          </article>
          <article className="mona-sat is-agenda">
            <p>
              <CalendarDays size={13} /> Agenda
            </p>
            <ul className="mona-sat__events">
              <li>
                <i className="is-rose" /> Reunião de alinhamento
              </li>
              <li>
                <i className="is-orange" /> Apresentação criativa
              </li>
              <li>
                <i className="is-lilac" /> Entrega de materiais
              </li>
            </ul>
          </article>
          <article className="mona-sat is-sops">
            <p>
              <ListChecks size={13} /> SOPs
            </p>
            <small>Onboarding de cliente</small>
            <small>Processo criativo</small>
          </article>
          <article className="mona-sat is-arquivos">
            <p>
              <Folder size={13} /> Arquivos
            </p>
            <ul>
              <li>Identidade Visual</li>
              <li>Contratos</li>
              <li>Briefings</li>
            </ul>
          </article>
          <article className="mona-sat is-fin">
            <p>
              <Wallet size={13} /> Financeiro
            </p>
            <strong>{money(received)}</strong>
            <em>+12%</em>
          </article>
          <article className="mona-sat is-comms">
            <p>
              <MessageCircle size={13} /> Comunicação
            </p>
            <small>
              <b>Ana Beatriz</b>
              <br />
              Ótimo! Vamos em frente.
            </small>
            <small>
              <b>Você</b>
              <br />
              Segue o material para revisão.
            </small>
          </article>

          <article className="mona-client">
            <header>
              <span>{initials || 'AB'}</span>
              <div>
                <h3>
                  {name}
                  <em>Ativo</em>
                </h3>
                <p>
                  {company}
                  <small>Cliente desde jan. 2024</small>
                </p>
              </div>
            </header>
            <nav>
              <b>Visão geral</b>
              <span>Tarefas</span>
              <span>Arquivos</span>
              <span>Financeiro</span>
              <span>Comunicação</span>
            </nav>
            <div className="mona-client__kpis">
              <div>
                <p>Contrato</p>
                <strong>Ativo</strong>
              </div>
              <div>
                <p>Tarefas pendentes</p>
                <strong>{pending}</strong>
              </div>
              <div>
                <p>Recebido</p>
                <strong>{money(received)}</strong>
              </div>
            </div>
            <div className="mona-client__split">
              <div>
                <p>Próximas tarefas</p>
                <ul>
                  <li>
                    Revisar proposta do rebranding <small>Hoje</small>
                  </li>
                  <li>
                    Aprovação das peças sociais <small>Amanhã</small>
                  </li>
                  <li>
                    Reunião de alinhamento <small>Sex, 14/06</small>
                  </li>
                </ul>
              </div>
              <div>
                <p>Última atividade</p>
                <ul>
                  <li>
                    Arquivo enviado <small>há 2h</small>
                  </li>
                  <li>
                    Mensagem <small>há 5h</small>
                  </li>
                  <li>
                    Tarefa concluída <small>há 1d</small>
                  </li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </Scene>

      <Scene on={path} className="is-path">
        <div className="mona-path">
          <span className="mona-path__floor" />
          {PROCESS.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.num} className="mona-path__item">
                <article className={`mona-path__card is-${step.tone}`}>
                  <span>{step.num}</span>
                  <i>
                    <Icon size={28} />
                  </i>
                  <h3>{step.title}</h3>
                  <ul>
                    {step.items.map((item) => (
                      <li key={item}>
                        <Check size={12} strokeWidth={3} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
                {index < PROCESS.length - 1 ? (
                  <b>
                    <ChevronRight size={16} />
                  </b>
                ) : null}
              </div>
            )
          })}
        </div>
      </Scene>

      <Scene on={scan} className="is-scan">
        <div className="mona-scan" style={{ '--beam': String(beam) } as CSSProperties}>
          <div className="mona-scan__chaos">
            {CHAOS.map((tile, index) => {
              const Icon = tile.icon
              const passed = beam * 100 > tile.x + 6
              return (
                <article
                  key={tile.kind + index}
                  className={`mona-mess is-${tile.kind}${passed ? ' is-gone' : ''}`}
                  style={{
                    left: `${tile.x}%`,
                    top: `${tile.y}%`,
                    transform: `rotate(${passed ? 0 : tile.rot}deg) scale(${passed ? 0.86 : 1})`,
                    opacity: passed ? 0.08 : 1,
                  }}
                >
                  <Icon size={14} />
                  {tile.title ? <p>{tile.title}</p> : null}
                </article>
              )
            })}
          </div>
          <div className="mona-scan__beam" />
          <div className="mona-scan__mona">
            <article className="mona-grid is-hero">
              <BrandLogo variant="mark" size={28} title="" />
              <div>
                <strong>Todos os seus projetos em um só lugar.</strong>
              </div>
              <div className="mona-grid__progress">
                <p>
                  Tarefas <b>12/12</b>
                </p>
                <span />
              </div>
            </article>
            {ORDERED.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className={`mona-grid${item.hint ? ` is-${item.hint}` : ''}`}>
                  <Icon size={16} />
                  <p>{item.title}</p>
                </article>
              )
            })}
          </div>
        </div>
      </Scene>

      <Scene on={arch} className="is-arch">
        <div className="mona-arch">
          <div className="mona-arch__well">
            <i />
            <i />
            <i />
          </div>
          <div className="mona-arch__ring is-clients">
            <strong>Clientes</strong>
            <span className="is-a">
              <Users size={16} />
            </span>
            <span className="is-b">
              <Building2 size={16} />
            </span>
            <span className="is-c">
              <MessageCircle size={16} />
            </span>
          </div>
          <div className="mona-arch__ring is-apps">
            <strong>Integrações</strong>
            <span className="is-g">
              <CalendarDays size={15} />
            </span>
            <span className="is-m">
              <Mail size={15} />
            </span>
            <span className="is-w">
              <MessageCircle size={15} />
            </span>
            <span className="is-s">
              <Hash size={15} />
            </span>
            <span className="is-p">
              <Wallet size={15} />
            </span>
          </div>
          <div className="mona-arch__ring is-ops">
            <strong>Processos</strong>
            <span className="is-a">
              <ListChecks size={15} />
            </span>
            <span className="is-b">
              <FileText size={15} />
            </span>
            <span className="is-c">
              <BarChart3 size={15} />
            </span>
            <span className="is-d">
              <Settings size={15} />
            </span>
          </div>
          <div className="mona-arch__dock">
            <span>
              <CalendarDays size={13} /> Agenda
            </span>
            <span>
              <CheckSquare size={13} /> Tarefas
            </span>
            <span>
              <BarChart3 size={13} /> Financeiro
            </span>
          </div>
        </div>
        <p className="mona-scene__foot">Mais organização • mais crescimento • mais liberdade</p>
      </Scene>

      <Scene on={finale} className="is-finale">
        <div className="mona-finale">
          <div className="mona-finale__well">
            <i />
            <i />
            <i />
          </div>
          {[
            { icon: CalendarDays, x: -38, y: -28 },
            { icon: CheckSquare, x: -42, y: 8 },
            { icon: Users, x: -28, y: 32 },
            { icon: FileText, x: 36, y: -30 },
            { icon: BarChart3, x: 42, y: 4 },
            { icon: MessageCircle, x: 30, y: 34 },
          ].map((chip, index) => {
            const Icon = chip.icon
            return (
              <span
                key={index}
                className="mona-finale__chip"
                style={{ left: `calc(50% + ${chip.x}%)`, top: `calc(50% + ${chip.y}%)` }}
              >
                <Icon size={16} />
              </span>
            )
          })}
        </div>
        <p className="mona-scene__foot is-end">Sua operação, em um só lugar</p>
      </Scene>
    </>
  )
}
