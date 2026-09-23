import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BookOpen, X } from 'lucide-react'
import {
  TUTORIAL_REOPEN_EVENT,
  getTutorialForPath,
  hasSeenTutorial,
  markTutorialSeen,
  type PageTutorial,
} from './pageTutorials'
import './pageTutorial.css'

export function reopenPageTutorial() {
  window.dispatchEvent(new CustomEvent(TUTORIAL_REOPEN_EVENT))
}

export function PageTutorialHost() {
  const { pathname } = useLocation()
  const tutorial = getTutorialForPath(pathname)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<PageTutorial | null>(null)

  useEffect(() => {
    if (!tutorial) {
      setOpen(false)
      setCurrent(null)
      return
    }
    setCurrent(tutorial)
    setOpen(!hasSeenTutorial(tutorial.key))
  }, [tutorial?.key, pathname])

  useEffect(() => {
    const onReopen = () => {
      const tip = getTutorialForPath(window.location.pathname)
      if (!tip) return
      setCurrent(tip)
      setOpen(true)
    }
    window.addEventListener(TUTORIAL_REOPEN_EVENT, onReopen)
    return () => window.removeEventListener(TUTORIAL_REOPEN_EVENT, onReopen)
  }, [])

  if (!open || !current) return null

  const dismiss = (remember: boolean) => {
    if (remember) markTutorialSeen(current.key)
    setOpen(false)
  }

  return (
    <aside className="mona-tutorial" role="dialog" aria-labelledby="mona-tutorial-title" aria-live="polite">
      <header className="mona-tutorial__head">
        <span className="mona-tutorial__icon" aria-hidden>
          <BookOpen size={16} />
        </span>
        <div>
          <p className="mona-tutorial__eyebrow">Tutorial</p>
          <h2 id="mona-tutorial-title">{current.title}</h2>
        </div>
        <button type="button" className="mona-tutorial__close" aria-label="Fechar" onClick={() => dismiss(true)}>
          <X size={16} />
        </button>
      </header>
      <p className="mona-tutorial__lead">{current.lead}</p>
      <ul className="mona-tutorial__tips">
        {current.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <div className="mona-tutorial__actions">
        <button type="button" className="mona-tutorial__ghost" onClick={() => dismiss(true)}>
          Não mostrar de novo
        </button>
        <button type="button" className="mona-tutorial__ok" onClick={() => dismiss(true)}>
          Entendi
        </button>
      </div>
    </aside>
  )
}
