import { useMemo, useState } from 'react'
import {
  Check,
  Copy,
  Eye,
  Layers3,
  Moon,
  Paintbrush,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Type,
  Wand2,
} from 'lucide-react'
import { Button, Card, Checkbox, Select } from '../ui'
import { displayFonts, uiFonts } from './fonts'
import { PRESET_META, defaultNotchChrome, hydrateAppearance, presetPrefs } from './presets'
import { useAppearance } from './ThemeContext'
import type { AppearancePrefs, AppearanceStage, TabStyle, TypeScale, WindowRadius, WindowShadow } from './types'

type AppearancePatch = Partial<Omit<AppearancePrefs, 'colors' | 'type' | 'chrome'>> & {
  colors?: Partial<AppearancePrefs['colors']>
  type?: Partial<AppearancePrefs['type']>
  chrome?: Partial<AppearancePrefs['chrome']>
}

const STAGES: { id: AppearanceStage; label: string; hint: string; icon: typeof Paintbrush }[] = [
  { id: 'presets', label: 'Identidade', hint: 'Look pronto e intenção visual', icon: Wand2 },
  { id: 'palette', label: 'Cores', hint: 'Marca, contraste e swatches', icon: Paintbrush },
  { id: 'type', label: 'Tipografia', hint: 'Fonte, escala e leitura', icon: Type },
  { id: 'chrome', label: 'Interface', hint: 'Recorte do menu, abas e janelas', icon: Layers3 },
]

const ACCENT_SWATCHES = [
  '#582B86',
  '#F54D7D',
  '#FF7A33',
  '#8B4BB8',
  '#0e7490',
  '#2563eb',
  '#111827',
  '#111111',
]

const QUICK_LOOKS: {
  id: string
  label: string
  hint: string
  patch: AppearancePatch | AppearancePrefs
}[] = [
  {
    id: 'clean',
    label: 'Clean MVP',
    hint: 'Mais ar, menos ruído, ideal para testers.',
    patch: {
      mode: 'light',
      type: { scale: 1, titleSize: 1.5, subtitleSize: 0.9, bodySize: 0.9, labelSize: 0.85, sidebarSize: 0.9, tabSize: 0.78 },
      chrome: { windowRadius: 'lg', windowShadow: 'soft', tabStyle: 'pill', tabIcons: true },
    },
  },
  {
    id: 'dense',
    label: 'Operação densa',
    hint: 'Mais informação por tela sem pesar.',
    patch: {
      type: { scale: 0.9, titleSize: 1.35, subtitleSize: 0.8, bodySize: 0.82, labelSize: 0.78, sidebarSize: 0.82, tabSize: 0.72 },
      chrome: { windowRadius: 'md', windowShadow: 'soft', tabStyle: 'underline', tabIcons: true },
    },
  },
  {
    id: 'executive',
    label: 'Executive dark',
    hint: 'Noite premium para longos turnos.',
    patch: presetPrefs('mona-ink'),
  },
  {
    id: 'accessible',
    label: 'Acessível',
    hint: 'Leitura forte, contraste e escala maior.',
    patch: presetPrefs('high-contrast'),
  },
]

function asHex(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'
}

function hexToRgb(hex: string) {
  const clean = asHex(hex).replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  }
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(a: string, b: string) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  return (
    <label className="mona-field">
      <span className="mona-field__label">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={asHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-[var(--mona-color-border)] bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mona-field__control font-mono uppercase"
          spellCheck={false}
        />
      </span>
    </label>
  )
}

function RangeField({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  unit = 'px',
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (n: number) => void
}) {
  return (
    <label className="mona-field">
      <span className="mona-field__label">
        {label}{' '}
        <span className="text-[var(--mona-color-muted)]">
          ({value}
          {unit})
        </span>
      </span>
      {hint && <span className="mb-1 block text-xs text-[var(--mona-color-muted)]">{hint}</span>}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

function SizeField({
  label,
  value,
  min = 0.65,
  max = 2.2,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (n: number) => void
}) {
  return (
    <label className="mona-field">
      <span className="mona-field__label">
        {label} <span className="text-[var(--mona-color-muted)]">({value.toFixed(2)}rem)</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function PreviewPanel({ appearance }: { appearance: AppearancePrefs }) {
  return (
    <Card className="sticky top-4 overflow-hidden p-0">
      <div className="border-b border-[var(--mona-color-border)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--mona-color-ink)]">Preview ao vivo</p>
            <p className="text-xs text-[var(--mona-color-muted)]">Menu, aba, card e tarefa no mesmo olhar.</p>
          </div>
          <Eye size={18} className="text-[var(--mona-color-muted)]" />
        </div>
      </div>

      <div className="grid min-h-[280px] grid-cols-1 bg-[var(--mona-color-bg)] sm:min-h-[360px] sm:grid-cols-[112px_1fr]">
        <aside
          className="border-r p-3"
          style={{
            background: appearance.chrome.sidebarBg,
            color: appearance.chrome.sidebarInk,
            borderColor: appearance.colors.border,
          }}
        >
          <div className="mb-4 h-9 w-9 rounded-xl border" style={{ borderColor: appearance.colors.border }} />
          {['Dashboard', 'Clientes', 'SOPs'].map((item, index) => (
            <div
              key={item}
              className="mb-2 rounded-lg px-2 py-2 text-xs font-semibold"
              style={
                index === 0
                  ? { background: appearance.chrome.sidebarActiveBg, color: appearance.chrome.sidebarActiveInk }
                  : undefined
              }
            >
              {item}
            </div>
          ))}
        </aside>
        <main className="min-w-0 p-4">
          <div className="mb-4 flex gap-2">
            {['Dashboard', 'Clientes'].map((tab, index) => (
              <span
                key={tab}
                className="rounded-xl px-3 py-2 text-xs font-semibold"
                style={
                  index === 0
                    ? { background: appearance.chrome.tabActiveBg, color: appearance.chrome.tabActiveInk }
                    : { color: appearance.colors.muted }
                }
              >
                {tab}
              </span>
            ))}
          </div>
          <h3
            className="brand-font text-[var(--mona-color-ink)]"
            style={{ fontSize: `${appearance.type.titleSize}rem` }}
          >
            Operação de AVs
          </h3>
          <p className="mt-1 text-sm text-[var(--mona-color-muted)]">Toda demanda com cliente, contexto e evidência.</p>

          <div className="mt-5 rounded-2xl border bg-[var(--mona-color-surface)] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--mona-color-ink)]">Mensagem vira tarefa</p>
              <span className="rounded-full bg-[var(--mona-color-accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--mona-color-accent)]">
                SLA 10 min
              </span>
            </div>
            <p className="text-xs text-[var(--mona-color-muted)]">
              Cliente: Bright Home Services. Próxima ação: checar agenda, confirmar região e registrar retorno.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-xs font-semibold"
                style={{ background: appearance.colors.accent, color: appearance.mode === 'dark' ? appearance.colors.bg : '#ffffff' }}
              >
                Criar demanda
              </button>
              <button type="button" className="rounded-lg border px-3 py-2 text-xs font-semibold text-[var(--mona-color-ink)]">
                Ver SOP
              </button>
            </div>
          </div>
        </main>
      </div>
    </Card>
  )
}

export function AppearanceStudio() {
  const { appearance, applyPreset, patchAppearance, resetAppearance, setAppearance, setTheme } = useAppearance()
  const [stage, setStage] = useState<AppearanceStage>('presets')
  const [advanced, setAdvanced] = useState(false)
  const [copied, setCopied] = useState(false)

  const contrast = useMemo(
    () => contrastRatio(appearance.colors.ink, appearance.colors.bg),
    [appearance.colors.bg, appearance.colors.ink],
  )
  const contrastLabel = contrast >= 7 ? 'Excelente' : contrast >= 4.5 ? 'Bom' : 'Ajustar'

  function applyPatch(patch: AppearancePatch) {
    patchAppearance(patch as Partial<AppearancePrefs>)
  }

  function applyAccent(accent: string) {
    patchAppearance({
      colors: { ...appearance.colors, accent },
      chrome: {
        ...appearance.chrome,
        sidebarActiveBg: accent,
        tabActiveInk: accent,
      },
    })
  }

  async function copyTheme() {
    const payload = JSON.stringify(appearance, null, 2)
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Copie o tema atual:', payload)
    }
  }

  function importTheme() {
    const raw = window.prompt('Cole o JSON de tema exportado pelo MONA:')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as AppearancePrefs
      if (!parsed.colors || !parsed.type || !parsed.chrome) throw new Error('Tema incompleto')
      setAppearance(hydrateAppearance({ ...parsed, preset: 'custom' }))
    } catch {
      window.alert('Tema inválido. Confira o JSON e tente novamente.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-[var(--mona-color-border)] bg-[var(--mona-color-surface)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--mona-color-ink)]">Estúdio de aparência</p>
                <p className="mt-1 max-w-2xl text-sm text-[var(--mona-color-muted)]">
                  Comece por uma intenção visual, ajuste só o necessário e veja tudo ao vivo antes de seguir.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={appearance.mode === 'light' ? 'primary' : 'secondary'} onClick={() => setTheme('light')}>
                  <Sun size={14} /> Claro
                </Button>
                <Button size="sm" variant={appearance.mode === 'dark' ? 'primary' : 'secondary'} onClick={() => setTheme('dark')}>
                  <Moon size={14} /> Escuro
                </Button>
                <Button size="sm" variant="secondary" onClick={copyTheme}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Exportar'}
                </Button>
                <Button size="sm" variant="secondary" onClick={importTheme}>
                  Importar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => resetAppearance()}>
                  <RotateCcw size={14} />
                  Restaurar
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {QUICK_LOOKS.map((look) => (
                <button
                  key={look.id}
                  type="button"
                  onClick={() => {
                    if (look.patch.colors && look.patch.type && look.patch.chrome) {
                      setAppearance({ ...(look.patch as AppearancePrefs), preset: look.id === 'accessible' ? 'high-contrast' : 'mona-ink' })
                    } else {
                      applyPatch(look.patch as AppearancePatch)
                    }
                  }}
                  className="rounded-xl border border-[var(--mona-color-border)] bg-[color-mix(in_srgb,var(--mona-color-surface)_88%,var(--mona-color-bg))] px-3 py-3 text-left transition hover:border-[var(--mona-color-accent)]"
                >
                  <p className="text-sm font-semibold text-[var(--mona-color-ink)]">{look.label}</p>
                  <p className="mt-1 text-xs text-[var(--mona-color-muted)]">{look.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(s.id)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-left text-sm font-semibold transition ${
                    stage === s.id
                      ? 'border-[var(--mona-color-accent)] bg-[var(--mona-color-accent)] text-[var(--mona-color-on-accent)]'
                      : 'border-[var(--mona-color-border)] bg-[var(--mona-color-surface)] text-[var(--mona-color-ink)] hover:border-[var(--mona-color-accent)]'
                  }`}
                >
                  <Icon size={15} />
                  <span>{s.label}</span>
                </button>
              )
            })}
          </div>

          {stage === 'presets' && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {PRESET_META.map((p) => {
                const sample = presetPrefs(p.id)
                const selected = appearance.preset === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className={`overflow-hidden rounded-2xl border text-left transition ${
                      selected
                        ? 'border-[var(--mona-color-accent)] ring-2 ring-[color-mix(in_srgb,var(--mona-color-accent)_30%,transparent)]'
                        : 'border-[var(--mona-color-border)] hover:border-[var(--mona-color-accent)]'
                    }`}
                  >
                    <div className="grid h-16 grid-cols-5">
                      {[
                        sample.chrome.sidebarBg,
                        sample.colors.bg,
                        sample.colors.surface,
                        sample.colors.accent,
                        sample.colors.ink,
                      ].map((hex, i) => (
                        <span key={`${p.id}-${i}`} style={{ background: hex }} />
                      ))}
                    </div>
                    <div className="bg-[var(--mona-color-surface)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--mona-color-ink)]">{p.name}</p>
                        {selected && <Check size={15} className="text-[var(--mona-color-accent)]" />}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--mona-color-muted)]">{p.blurb}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {stage === 'palette' && (
            <Card>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--mona-color-ink)]">Cores com segurança visual</p>
                  <p className="mt-1 text-xs text-[var(--mona-color-muted)]">
                    Contraste texto/fundo: {contrast.toFixed(1)}:1 - {contrastLabel}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      title={hex}
                      onClick={() => applyAccent(hex)}
                      className="h-8 w-8 rounded-full border border-[var(--mona-color-border)] ring-offset-2 ring-offset-[var(--mona-color-surface)]"
                      style={{ background: hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField label="Acento" value={appearance.colors.accent} onChange={applyAccent} />
                <ColorField
                  label="Fundo da página"
                  value={appearance.colors.bg}
                  onChange={(bg) => patchAppearance({ colors: { ...appearance.colors, bg } })}
                />
                <ColorField
                  label="Superfície"
                  value={appearance.colors.surface}
                  onChange={(surface) => patchAppearance({ colors: { ...appearance.colors, surface } })}
                />
                <ColorField
                  label="Texto"
                  value={appearance.colors.ink}
                  onChange={(ink) => patchAppearance({ colors: { ...appearance.colors, ink } })}
                />
              </div>

              {advanced && (
                <div className="mt-4 grid gap-4 border-t border-[var(--mona-color-border)] pt-4 sm:grid-cols-2">
                  <ColorField
                    label="Texto auxiliar"
                    value={appearance.colors.muted}
                    onChange={(muted) => patchAppearance({ colors: { ...appearance.colors, muted } })}
                  />
                  <ColorField
                    label="Bordas"
                    value={appearance.colors.border}
                    onChange={(border) => patchAppearance({ colors: { ...appearance.colors, border } })}
                  />
                </div>
              )}
            </Card>
          )}

          {stage === 'type' && (
            <Card>
              <div className="mb-5 grid gap-3 md:grid-cols-4">
                {[
                  ['0.9', 'Compacta'],
                  ['1', 'Padrão'],
                  ['1.1', 'Confortável'],
                  ['1.2', 'Ampla'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patchAppearance({ type: { ...appearance.type, scale: Number(value) as TypeScale } })}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold ${
                      String(appearance.type.scale) === value
                        ? 'border-[var(--mona-color-accent)] bg-[var(--mona-color-accent-soft)] text-[var(--mona-color-accent)]'
                        : 'border-[var(--mona-color-border)] text-[var(--mona-color-ink)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Fonte da interface"
                  value={appearance.type.uiFont}
                  onChange={(e) => patchAppearance({ type: { ...appearance.type, uiFont: e.target.value } })}
                >
                  {uiFonts().map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Fonte de títulos"
                  value={appearance.type.displayFont}
                  onChange={(e) => patchAppearance({ type: { ...appearance.type, displayFont: e.target.value } })}
                >
                  {displayFonts().map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </div>

              {advanced && (
                <div className="mt-5 grid gap-4 border-t border-[var(--mona-color-border)] pt-4 sm:grid-cols-2">
                  <SizeField
                    label="Título de página"
                    value={appearance.type.titleSize}
                    onChange={(titleSize) => patchAppearance({ type: { ...appearance.type, titleSize } })}
                  />
                  <SizeField
                    label="Subtítulo"
                    value={appearance.type.subtitleSize}
                    onChange={(subtitleSize) => patchAppearance({ type: { ...appearance.type, subtitleSize } })}
                  />
                  <SizeField
                    label="Corpo"
                    value={appearance.type.bodySize}
                    onChange={(bodySize) => patchAppearance({ type: { ...appearance.type, bodySize } })}
                  />
                  <SizeField
                    label="Menu lateral"
                    value={appearance.type.sidebarSize}
                    onChange={(sidebarSize) => patchAppearance({ type: { ...appearance.type, sidebarSize } })}
                  />
                </div>
              )}
            </Card>
          )}

          {stage === 'chrome' && (
            <div className="space-y-4">
              <Card>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Recorte do item ativo</p>
                    <p className="mt-1 text-xs text-[var(--mona-color-muted)]">
                      O U do menu recolhido. Recolha a barra à esquerda para ver o ajuste ao vivo.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => patchAppearance({ chrome: { ...appearance.chrome, ...defaultNotchChrome } })}
                  >
                    Restaurar recorte
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <RangeField
                    label="Tamanho"
                    hint="Altura do recorte em U"
                    value={appearance.chrome.notchSize ?? 64}
                    min={64}
                    max={160}
                    onChange={(notchSize) => patchAppearance({ chrome: { ...appearance.chrome, notchSize } })}
                  />
                  <RangeField
                    label="Profundidade"
                    hint="Quanto o U entra no menu"
                    value={appearance.chrome.notchDepth ?? 59}
                    min={36}
                    max={96}
                    onChange={(notchDepth) => patchAppearance({ chrome: { ...appearance.chrome, notchDepth } })}
                  />
                  <RangeField
                    label="Curva"
                    hint="Canto de encontro com a barra"
                    value={appearance.chrome.notchScoop ?? 19}
                    min={10}
                    max={40}
                    onChange={(notchScoop) => patchAppearance({ chrome: { ...appearance.chrome, notchScoop } })}
                  />
                  <RangeField
                    label="Avanço do ícone"
                    hint="Quanto o círculo entra no recorte"
                    value={appearance.chrome.notchPop ?? 11}
                    min={0}
                    max={36}
                    onChange={(notchPop) => patchAppearance({ chrome: { ...appearance.chrome, notchPop } })}
                  />
                  <RangeField
                    label="Círculo"
                    hint="Diâmetro do botão ativo"
                    value={appearance.chrome.notchCircle ?? 39}
                    min={32}
                    max={64}
                    onChange={(notchCircle) => patchAppearance({ chrome: { ...appearance.chrome, notchCircle } })}
                  />
                  <RangeField
                    label="Sombra"
                    hint="Relevo do círculo sobre o recorte"
                    value={appearance.chrome.notchShadow ?? 12}
                    min={0}
                    max={18}
                    onChange={(notchShadow) => patchAppearance({ chrome: { ...appearance.chrome, notchShadow } })}
                  />
                </div>
              </Card>
              <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <p className="mb-3 text-sm font-semibold">Menu lateral</p>
                <div className="grid gap-4">
                  <ColorField
                    label="Fundo"
                    value={appearance.chrome.sidebarBg}
                    onChange={(sidebarBg) => patchAppearance({ chrome: { ...appearance.chrome, sidebarBg } })}
                  />
                  <ColorField
                    label="Texto / ícones"
                    value={appearance.chrome.sidebarInk}
                    onChange={(sidebarInk) => patchAppearance({ chrome: { ...appearance.chrome, sidebarInk } })}
                  />
                  {advanced && (
                    <>
                      <ColorField
                        label="Item ativo - fundo"
                        value={appearance.chrome.sidebarActiveBg}
                        onChange={(sidebarActiveBg) => patchAppearance({ chrome: { ...appearance.chrome, sidebarActiveBg } })}
                      />
                      <ColorField
                        label="Item ativo - texto"
                        value={appearance.chrome.sidebarActiveInk}
                        onChange={(sidebarActiveInk) => patchAppearance({ chrome: { ...appearance.chrome, sidebarActiveInk } })}
                      />
                    </>
                  )}
                </div>
              </Card>
              <Card>
                <p className="mb-3 text-sm font-semibold">Abas e janelas</p>
                <div className="grid gap-4">
                  <Select
                    label="Estilo da aba"
                    value={appearance.chrome.tabStyle}
                    onChange={(e) => patchAppearance({ chrome: { ...appearance.chrome, tabStyle: e.target.value as TabStyle } })}
                  >
                    <option value="pill">Pílula</option>
                    <option value="chip">Chip arredondado</option>
                    <option value="underline">Sublinhada</option>
                  </Select>
                  <Select
                    label="Cantos das janelas"
                    value={appearance.chrome.windowRadius}
                    onChange={(e) => patchAppearance({ chrome: { ...appearance.chrome, windowRadius: e.target.value as WindowRadius } })}
                  >
                    <option value="sm">Retos</option>
                    <option value="md">Médios</option>
                    <option value="lg">Amplos</option>
                  </Select>
                  <Select
                    label="Sombra"
                    value={appearance.chrome.windowShadow}
                    onChange={(e) => patchAppearance({ chrome: { ...appearance.chrome, windowShadow: e.target.value as WindowShadow } })}
                  >
                    <option value="soft">Suave</option>
                    <option value="strong">Marcada</option>
                  </Select>
                  <Checkbox
                    label="Mostrar ícone na aba e na janela"
                    checked={appearance.chrome.tabIcons}
                    onChange={(e) => patchAppearance({ chrome: { ...appearance.chrome, tabIcons: e.target.checked } })}
                  />
                </div>
              </Card>
            </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAdvanced((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--mona-color-border)] bg-[var(--mona-color-surface)] px-3 py-2 text-sm font-semibold text-[var(--mona-color-ink)]"
          >
            <SlidersHorizontal size={15} />
            {advanced ? 'Ocultar controles avançados' : 'Mostrar controles avançados'}
          </button>
        </div>

        <PreviewPanel appearance={appearance} />
      </div>
    </div>
  )
}
