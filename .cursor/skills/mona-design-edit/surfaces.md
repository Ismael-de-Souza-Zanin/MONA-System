# Mapa de superfícies

Caminhos relativos a `frontend/src/`.

## Arquivos

| Arquivo | Dono |
|---|---|
| `styles/tokens.css` | Escala, tenant `--fv-*`, semântica `--mona-color-*`, chrome default, claro e escuro |
| `styles/semantic.css` | Classes `.mona-*`. Layer = sistema. Fora da layer = mobile e `.mona-m-*` |
| `styles/compat.css` | Ponte `.fv-*` antiga. Não estender |
| `index.css` | Imports, `@theme` Tailwind, fundo do `body`. Sem componente novo |
| `shared/theme/presets.ts` | `fatto-light`, `fatto-dark`, `studio-sand`, `mona-ink`, `ocean`, `high-contrast` |
| `shared/theme/applyAppearance.ts` | Overrides inline. Lista `OVERRIDES` |
| `shared/theme/types.ts` | Contrato de paleta, tipo e chrome |
| `shared/theme/AppearanceStudio.tsx` | Configurações → Aparência |
| `shared/ui/` | React que só aplica classe |
| `app/AppLayout.tsx` | Shell, sidebar, notch, breakpoint 768 |
| `app/FloatingTabsLayer.tsx` | Abas flutuantes no desktop |
| `features/landing/landing.css` | `/conheca` apenas |
| `shared/tutorial/pageTutorial.css` | Tutorial de página |

## Tokens que a tela deve ler

| Papel | Token |
|---|---|
| Fundo da app | `--mona-color-bg` |
| Cartão / campo | `--mona-color-surface` |
| Texto | `--mona-color-ink` |
| Texto secundário | `--mona-color-muted` |
| Borda | `--mona-color-border` |
| Acento e hover | `--mona-color-accent`, `--mona-color-accent-hover` |
| Acento suave | `--mona-color-accent-soft`, `--mona-color-accent-muted` |
| Texto sobre acento | `--mona-color-on-accent` |
| Marca fixa (não personalizável) | `--mona-color-purple`, `--mona-color-pink`, `--mona-color-orange` |
| CTA | `--mona-gradient-cta` (reescrito em runtime) |
| Raio | `--mona-radius-sm` 12, `md` 20, `lg` 24, `xl` 32, `2xl` 40, `pill` |
| Espaço | `--mona-space-1` … `--mona-space-12` |
| Controle | `--mona-control-h` 44px, `sm` 36, `lg` 50 |
| Tipo | `--mona-font-ui`, `--mona-font-display`, `--mona-type-title|subtitle|body|label|sidebar|tab`, `--mona-type-scale` |
| Menu | `--mona-chrome-sidebar-*` |
| Abas | `--mona-chrome-tab-active-bg`, `--mona-chrome-tab-active-ink`, `--mona-chrome-tab-ink` |
| Janela | `--mona-chrome-window-bg`, `title-bg`, `radius`, `shadow` |
| Empilhamento | `--mona-z-dock` 20, `dropdown` 40, `modal` 50, `toast` 60, `float` 70 |

Status de cliente: `--mona-status-active|inactive|notice|hold` (+ `-soft`, `-ink`). Feedback: `--mona-color-danger|success|warning|info` (+ `-soft`, `-ink`).

## Classes por peça

| Peça | Classe / componente | Região em `semantic.css` |
|---|---|---|
| Página | `PageHeader` → `.mona-page__header\|title\|subtitle\|actions` | `@layer` início |
| Workspace | `.mona-workspace`, `.is-client-locked` | `@layer` |
| Cartão | `Card` → `.mona-card`, `.is-hoverable` | `@layer` |
| Campo | `Input` / `Select` / `Textarea` → `.mona-field`, `__label`, `__control`, `__error`, `.is-invalid` | `@layer` |
| Botão | `Button` → `.mona-btn`, `--primary\|secondary\|ghost\|danger`, `--sm\|md\|lg` | `@layer` |
| Status | `StatusBadge` → `.mona-pill`, `.mona-status--active\|inactive\|notice\|hold` | `@layer` |
| Modal | `Modal` → `.mona-modal`, `__backdrop`, `__dialog--sm\|md\|lg` | `@layer` e de novo fora da layer no mobile |
| Vazio / alerta | `.mona-empty`, `.mona-alert--danger\|info` | `@layer` |
| Marca | `.mona-brand`, `.mona-wordmark` | `@layer` |
| Sidebar | `.mona-sidebar`, `__nav`, `__link`, `.is-active`, `.is-compact`, `.has-notch`, `.mona-fan` | `@layer` |
| Dock mobile | `.mona-sidebar.is-mobile-dock`, `.mona-dock` | `@layer` |
| Mais (mobile) | `.mona-more-sheet`, `.mona-more-backdrop` | `@layer` |
| Topo | `.mona-topbar`, `.mona-pathbar`, `.mona-crumbs`, `.mona-search`, `.mona-icon-btn` | `@layer` |
| Home | `.mona-hero`, `.mona-home__*` | `@layer`; espelho `.mona-m-*` fora da layer |
| Abas | `.mona-tabbar`, `.mona-tablist`, `.mona-tab`, `.is-active`, `.is-float` | `@layer`; `html[data-tab-style]` logo abaixo |
| Janela | `.mona-window`, `__titlebar` | fim da `@layer` |
| Tabela de gestão | `.mona-data-table` + `data-label` na célula | fora da layer, sob `.mona-shell.is-mobile` |
| Quadro de tarefas | `.mona-board`, `.mona-column-handle` | fora da layer |
| Landing | `.mona-land`, `__nav`, `__sky`, `__canvas`, `__card` | `features/landing/landing.css` |

## Shell

```text
.mona-shell[.is-mobile]
  .mona-sidebar[.is-compact|.is-mobile-dock][.has-notch]
  .mona-canvas
    .mona-topbar
    .mona-pathbar
    .mona-tabbar > .mona-tab
    .mona-workspace > .mona-page
    .mona-window
```

Rotas autenticadas passam por `app/AppLayout.tsx`. Fora do shell: `/conheca`, `/login`, `/s/:token`.

## Telas

| Rota | Pasta |
|---|---|
| `/` | `features/dashboard` |
| `/conheca` | `features/landing` |
| `/login` | `features/auth` |
| `/clientes` | `features/clients` |
| `/prestadores` | `features/employees` |
| `/agenda` | `features/agenda` |
| `/todos` | `features/todos` |
| `/configuracoes` | `features/settings` + `AppearanceStudio` |
| demais módulos | `features/<nome>` espelhando `app/router.tsx` |
