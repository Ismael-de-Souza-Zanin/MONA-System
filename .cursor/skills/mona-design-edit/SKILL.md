---
name: mona-design-edit
description: >-
  Edita a interface MONA com precisão de camada: tokens, presets, classes
  semânticas, chrome, landing e componentes shared/ui. Use em qualquer mudança
  visual, de layout, CSS, tema, aparência, tipografia, sidebar, abas, notch,
  botão, cartão, modal ou tela do frontend React.
---

# Edição precisa do design MONA

Leia [surfaces.md](surfaces.md) para achar a classe e o arquivo da peça. O guia humano está em `frontend/src/styles/README.md`.

Identidade: roxo `#582B86`, rosa `#F54D7D`, laranja `#FF7A33`, creme `#FFF7F1`, tinta `#1A1028`. Verde antigo não é a referência.

## Escolha a camada antes de editar

| Pedido | Onde editar | Não edite |
|---|---|---|
| Cor, raio, espaço, tipo ou sombra de produto | `frontend/src/styles/tokens.css` **e** o par em `shared/theme/presets.ts` quando o valor entra na paleta/chrome | hex ou `bg-*` / `text-*` na página |
| Valor que o estúdio sobrescreve (acento, fundo, superfície, tinta, muted, borda, fontes, tamanhos de papel, sidebar, aba ativa, raio/sombra da janela, notch, gradiente CTA, fundo pontilhado) | `tokens.css` + `presets.ts` + `shared/theme/applyAppearance.ts` se a fórmula estiver lá | só `tokens.css` — o `html[style]` ganha |
| Aparência de botão, campo, cartão, modal, sidebar, aba, janela | classe em `frontend/src/styles/semantic.css` dentro de `@layer mona` | componente React, salvo a classe que ele aplica |
| Peça nova sem componente | classe `.mona-*` em `semantic.css`, depois o React em `shared/ui` | `index.css`, `compat.css` |
| Layout de uma tela (grid, gap, ordem) | Tailwind estrutural no `features/<tela>` (`flex`, `grid`, `gap-*`, `w-full`) | cor, raio, borda, sombra via Tailwind |
| Landing `/conheca` | `features/landing/landing.css` e `LandingPage.tsx` | chrome do app |
| Mobile abaixo de 768px | skill `mona-responsive-parity` | media query solta que ignore `.mona-shell.is-mobile` |

`applyAppearance` grava overrides inline em `documentElement` a partir de `localStorage` `mona_appearance_v1` e sempre vence `tokens.css` para as variáveis da lista `OVERRIDES`. `--mona-color-purple`, `--mona-color-pink`, `--mona-color-orange` e as cores de status **não** entram nessa lista.

O gradiente de CTA (`SUNSET_CTA`) e o fundo `--mona-color-bg-accent` / `--mona-dot-color` são reaplicados em `applyAppearance.ts`. Mudar só o token não aparece no app logado.

## Regras de escrita

- Prefixo `mona-`. Bloco `.mona-card`, elemento `.mona-field__label`, modificador `.mona-btn--primary`, estado `.is-invalid` / `.is-active` / `.is-client-locked`.
- No CSS aninhado, escreva o nome completo. `&__label` e `&--primary` viram `:is(.bloco)__label` neste Tailwind 4. Aninhe só `&:hover`, `&:disabled`, `&.is-invalid` e descendentes.
- Reuse `shared/ui`: `Button` (`primary|secondary|ghost|danger`, `sm|md|lg`), `Input`, `Select`, `Textarea`, `Checkbox`, `Card` (`hover`), `Modal` (`sm|md|lg`), `PageHeader`, `StatusBadge`, `EmptyState`, `DropdownMenu`, `ErrorAlert`.
- Hex de produto só em `tokens.css`, `presets.ts` e `applyAppearance.ts`. Hex de categoria/coluna vindo da API é dado: não troque por cor de marca.
- Estado precisa de rótulo ou ícone, não só de cor.
- `compat.css` e utilitários `text-teal-*` / `text-ink-*` / `bg-brand-*` são legado. Não copie em tela nova.
- Não crie classe `.fv-*`. `--fv-*` é a camada de tenant que alimenta `--mona-color-*`.
- Cliente ativo: `--mona-color-client-accent` e `.mona-workspace.is-client-locked`.

## Duas folhas dentro de semantic.css

1. `@layer mona` (até `.mona-window`) — sistema de componentes. Edite aqui a aparência compartilhada.
2. Regras **fora** da layer, a partir de `.mona-mobile-only` — vencem a layer. Inclui `.mona-m-*` e overrides de `.mona-shell.is-mobile`. Se um ajuste dentro da layer “não pega”, procure a mesma classe depois da layer.

## Chrome frágil

Sidebar, notch, abas e janelas estão acoplados:

- Largura do shell mobile: `window.innerWidth < 768` em `app/AppLayout.tsx` adiciona `.mona-shell.is-mobile` e `.mona-sidebar.is-mobile-dock`. O CSS do app reage a essas classes, não a `@media` solto.
- O recorte da sidebar é máscara CSS (`--mona-notch-*` em `.mona-sidebar.has-notch`) mais o path SVG `notchPath` / `notchPathUp` em `AppLayout.tsx`. Mude os dois juntos. O estúdio limita size 64–160, depth 36–96, scoop 10–40, pop 0–36, circle 32–64, shadow 0–18 (`applyAppearance.ts`).
- Estilo de aba: `html[data-tab-style="pill|underline|chip"]`. Ícones: `data-tab-icons="on|off"`.
- Janela flutuante: `.mona-window` lê `--mona-chrome-window-*`.

## Landing

`html.is-landing` e `.mona-land*` usam hex fixo da marca e breakpoints 767px e 900px. Não ligue a landing aos overrides do estúdio, a menos que o pedido seja exatamente esse.

## Antes de encerrar

Siga a skill `mona-design-verify`. Confira claro e escuro. Se o token é sobrescrito pelo estúdio, confira também um preset que não seja MONA claro (Oceano ou Studio areia) em Configurações → Aparência.
