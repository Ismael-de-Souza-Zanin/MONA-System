export interface FontOption {
  id: string
  label: string
  css: string
  href?: string
  kind: 'ui' | 'display' | 'both'
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'dm-sans',
    label: 'DM Sans',
    css: '"DM Sans", "Source Sans 3", system-ui, sans-serif',
    kind: 'ui',
  },
  {
    id: 'source-sans',
    label: 'Source Sans 3',
    css: '"Source Sans 3", system-ui, sans-serif',
    href: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
    kind: 'ui',
  },
  {
    id: 'inter',
    label: 'Inter',
    css: 'Inter, system-ui, sans-serif',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    kind: 'ui',
  },
  {
    id: 'nunito',
    label: 'Nunito Sans',
    css: '"Nunito Sans", system-ui, sans-serif',
    href: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,600;0,6..12,700;1,6..12,400&display=swap',
    kind: 'ui',
  },
  {
    id: 'ibm-plex',
    label: 'IBM Plex Sans',
    css: '"IBM Plex Sans", system-ui, sans-serif',
    href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
    kind: 'ui',
  },
  {
    id: 'outfit',
    label: 'Outfit',
    css: 'Outfit, system-ui, sans-serif',
    href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap',
    kind: 'both',
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    css: '"Space Grotesk", system-ui, sans-serif',
    href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
    kind: 'both',
  },
  {
    id: 'fraunces',
    label: 'Fraunces',
    css: 'Fraunces, Georgia, serif',
    kind: 'display',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    css: '"Playfair Display", Georgia, serif',
    href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap',
    kind: 'display',
  },
  {
    id: 'literata',
    label: 'Literata',
    css: 'Literata, Georgia, serif',
    href: 'https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,500;0,7..72,600;0,7..72,700;1,7..72,500&display=swap',
    kind: 'display',
  },
]

const loaded = new Set<string>()

export function fontById(id: string) {
  return FONT_OPTIONS.find((f) => f.id === id)
}

export function ensureFont(id: string) {
  const font = fontById(id)
  if (!font?.href || loaded.has(id) || typeof document === 'undefined') return
  loaded.add(id)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = font.href
  document.head.appendChild(link)
}

export function uiFonts() {
  return FONT_OPTIONS.filter((f) => f.kind === 'ui' || f.kind === 'both')
}

export function displayFonts() {
  return FONT_OPTIONS.filter((f) => f.kind === 'display' || f.kind === 'both')
}
