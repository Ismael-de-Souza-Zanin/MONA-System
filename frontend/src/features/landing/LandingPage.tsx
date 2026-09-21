import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, BarChart3, CalendarDays, CheckSquare, FileText, ListChecks, Mail, MessageCircle, Sparkles, Users, Wallet, Zap } from 'lucide-react'
import { BrandLogo } from '../../shared/ui'
import { useAuth } from '../../shared/auth/AuthContext'
import { createMonaScene } from './monaScene'
import { LandingLive } from './LandingLive'
import { STATIONS } from './stations'
import { LAND_NODES, nodeRing2d } from './landingNodes'
import { LAND_BACKGROUNDS, bgFade } from './landingBgs'
import dashCapture from './captures/dash.png'
import './landing.css'

const CHIP_META = {
  tarefas: { hint: 'O que precisa ser feito hoje.', icon: CheckSquare },
  onboarding: { hint: 'Do primeiro contato à operação.', icon: ListChecks },
  financeiro: { hint: 'Cobranças e recebidos no mesmo lugar.', icon: Wallet },
  contratos: { hint: 'Documentos da operação, juntos.', icon: FileText },
  agenda: { hint: 'Tudo do seu dia, em um só lugar.', icon: CalendarDays },
  emails: { hint: 'Inbox da operação, em um lugar.', icon: Mail },
  whatsapp: { hint: 'Conversas da operação, juntas.', icon: MessageCircle },
  clientes: { hint: 'Histórico completo e mais personalização.', icon: Users },
} as const

gsap.registerPlugin(ScrollTrigger)

function stationFromProgress(progress: number) {
  const index = Math.round(progress * (STATIONS.length - 1))
  return Math.min(STATIONS.length - 1, Math.max(0, index))
}

export function LandingPage() {
  const { isAuthenticated } = useAuth()
  const landRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [station, setStation] = useState(0)
  const [progress, setProgress] = useState(0)
  const enterTo = isAuthenticated ? '/' : '/login'
  const enterLabel = isAuthenticated ? 'Ir para o app' : 'Começar agora'

  useEffect(() => {
    document.documentElement.classList.add('is-landing')
    return () => document.documentElement.classList.remove('is-landing')
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const pin = pinRef.current
    const bar = barRef.current
    if (!canvas || !pin) return

    const scene = createMonaScene(canvas)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const onResize = () => scene.resize()
    window.addEventListener('resize', onResize)

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: pin,
        start: 'top top',
        end: 'bottom bottom',
        scrub: reduced ? 0 : 1.05,
        onUpdate: (self) => {
          const progress = self.progress
          scene.setProgress(progress)
          setProgress(progress)
          landRef.current?.style.setProperty('--land', String(progress))
          if (bar) bar.style.width = `${progress * 100}%`
          const next = stationFromProgress(progress)
          setStation((current) => (current === next ? current : next))
        },
      })
    }, pin)

    scene.setProgress(0)

    return () => {
      window.removeEventListener('resize', onResize)
      ctx.revert()
      scene.dispose()
    }
  }, [])

  const jumpTo = (index: number) => {
    const pin = pinRef.current
    if (!pin) return
    const max = pin.offsetHeight - window.innerHeight
    window.scrollTo({ top: pin.offsetTop + max * (index / (STATIONS.length - 1)), behavior: 'smooth' })
  }

  return (
    <div
      ref={landRef}
      className={`mona-land${station > 0 ? ' is-played' : ''}`}
      style={{ '--land': 0 } as CSSProperties}
    >
      <div ref={barRef} className="mona-land__progress" />
      <div className="mona-land__sky" aria-hidden>
        {LAND_BACKGROUNDS.map((src, index) => (
          <img
            key={src}
            className="mona-land__bg"
            src={src}
            alt=""
            style={{ opacity: bgFade(progress, index) }}
          />
        ))}
      </div>
      <canvas ref={canvasRef} className="mona-land__canvas" aria-hidden />

      <header className="mona-land__nav">
        <Link to="/conheca" className="mona-land__brand" aria-label="MONA">
          <BrandLogo size={34} showWordmark wordAsText title="MONA" />
        </Link>
        <div className="flex items-center gap-4">
          <a className="mona-land__skip" href="#mona-land-cta">
            Pular história
          </a>
          <Link to={enterTo} className="mona-land__enter">
            {enterLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <div className="mona-land__dots" aria-label="Estações">
        {STATIONS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === station ? 'is-on' : ''}
            aria-label={`${item.num} ${item.title}`}
            onClick={() => jumpTo(index)}
          />
        ))}
      </div>

      <div className="mona-land__hint" aria-hidden>
        Role para explorar
        <span />
      </div>

      <div ref={pinRef} className="mona-land__pin">
        <div className="mona-land__stage">
          <figure className="mona-pad" aria-hidden>
            <div className="mona-pad__screen">
              <span className="mona-pad__glow" />
              <img className="mona-pad__ui" src={dashCapture} alt="" />
              <span className="mona-pad__glass" />
            </div>
          </figure>
          <div className="mona-land__float" aria-hidden>
            {LAND_NODES.map((node) => {
              const meta = CHIP_META[node.key]
              const Icon = meta.icon
              const ring = nodeRing2d(node.angle)
              return (
                <article
                  key={node.key}
                  className={`mona-land__chip is-${node.tone}${node.hero ? '' : ' is-late'}`}
                  style={
                    {
                      '--hx': node.hx,
                      '--hy': node.hy,
                      '--rx': ring.x,
                      '--ry': ring.y,
                      '--arot': node.rot,
                    } as CSSProperties
                  }
                >
                  <span className="mona-land__chip-icon">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <span className="mona-land__chip-copy">
                    <strong>{node.label}</strong>
                    <span>{meta.hint}</span>
                  </span>
                  <span className="mona-land__chip-go">
                    <ArrowRight size={12} />
                  </span>
                </article>
              )
            })}
          </div>
          <LandingLive progress={progress} />
          {STATIONS.map((item, index) => (
            <article
              key={item.id}
              id={item.id === 'cta' ? 'mona-land-cta' : undefined}
              className={`mona-land__card is-${item.side}${index === station ? ' is-on' : ''}`}
            >
              <p className="mona-land__num">{item.num}</p>
              <p className="mona-land__kicker">{item.kicker}</p>
              <h1 className="mona-land__title">{item.title}</h1>
              <p className="mona-land__lead">{item.lead}</p>
              {item.stories.length ? (
                <ul className="mona-land__stories">
                  {item.stories.map((story) => (
                    <li key={story.label} className={`is-${story.tone}`}>
                      <i>
                        {story.label.startsWith('Tarefas') ? (
                          <CheckSquare size={14} />
                        ) : story.label === 'Agenda' ? (
                          <CalendarDays size={14} />
                        ) : (
                          <BarChart3 size={14} />
                        )}
                      </i>
                      <div>
                        <strong>{story.label}</strong>
                        <span>{story.hint}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.points.length ? (
                <ul className="mona-land__points">
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}
              {item.id === 'welcome' || item.id === 'cta' || item.id === 'clients' ? (
                <div className="mona-land__actions">
                  <Link to={enterTo} className="mona-land__enter">
                    {item.id === 'clients' ? 'Fazer tour agora' : enterLabel}
                    <ArrowRight size={16} />
                  </Link>
                  {item.id === 'welcome' ? (
                    <button type="button" className="mona-land__ghost" onClick={() => jumpTo(1)}>
                      Ver como funciona
                    </button>
                  ) : null}
                  {item.id === 'cta' ? (
                    <Link to="/login" className="mona-land__ghost">
                      Já tenho conta
                    </Link>
                  ) : null}
                </div>
              ) : null}
              {item.stats.length ? (
                <ul className="mona-land__stats">
                  {item.stats.map((stat) => (
                    <li key={stat.label}>
                      {stat.label === 'Mais tempo' ? <Zap size={14} /> : stat.label === 'Mais clientes' ? <Sparkles size={14} /> : <BarChart3 size={14} />}
                      <span>{stat.label}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
