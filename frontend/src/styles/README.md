# Design system MONA — guia da júnior

A Fatto é o primeiro tenant. O verde que a Ju já conhece **não muda** no preset padrão.
O que muda é *onde* a cor vive: tokens e classes semânticas, não hex solto na página.
A usuária personaliza em **Configurações → Aparência**, por etapas.

## Onde está o quê

| Arquivo | Responsabilidade |
|---------|------------------|
| `tokens.css` | Variáveis. Único lugar com hex de produto. |
| `semantic.css` | Classes `.mona-*` com NestCSS (bloco, elemento, estado). |
| `compat.css` | `.fv-card` / overrides de páginas antigas. Não copiar. |
| `../index.css` | Tailwind `@theme` + imports. Não colocar componente novo aqui. |
| `../shared/ui/` | Componentes React. Eles **só** aplicam classe semântica. |
| `../shared/theme/` | Presets, paleta, tipografia, chrome. Aplica overrides no `html`. |

## Camadas de token

```text
--fv-* / --tenant-*     identidade Fatto (ou futuro outro tenant)
        ↓
--mona-color-*          semântica do produto (surface, ink, accent, danger)
--mona-type-*           tipografia (fonte, escala, tamanho por papel)
--mona-chrome-*         menu, abas, janelas
        ↓
html[style]             overrides da usuária (estúdio de aparência)
        ↓
.mona-btn--primary      classe que a tela usa
.mona-sidebar__link
.mona-tab
.mona-window
```

- Precisa da cor da Fatto? Use `var(--mona-color-accent)` ou a classe.
- Outra empresa no futuro? Só o tenant muda. As classes continuam iguais.
- A usuária mudou a paleta? Os mesmos tokens mudam. Não pinte a página de novo.
- Cliente ativo (anti-mistura de contexto): `--mona-color-client-accent` + `.mona-workspace.is-client-locked`.

## Personalização — etapas

1. **Presets** — Fatto claro/escuro, Studio areia, MONA tinta, Oceano, Alto contraste.
2. **Paleta** — acento, fundo, superfície, texto, auxiliar, borda.
3. **Tipografia** — fonte de UI, fonte de título, escala, tamanho por papel (título, subtítulo, corpo, rótulo, menu, aba).
4. **Chrome** — cores do menu, estilo/ícone das abas, cantos e sombra das janelas.

O que ainda não é desta etapa: gravar no servidor, white-label da organização, acento por cliente.

## Como fazer uma tela nova

1. Layout (grid, flex, gap) pode ser Tailwind: `flex`, `grid`, `gap-4`, `w-full`.
2. Aparência **não**: sem `bg-brand-800`, `text-ink-900`, `rounded-xl`, `border-ink-300` novos.
3. Use o componente de `shared/ui` (`Button`, `Card`, `Input`, `PageHeader`…).
4. Chrome do workspace usa `.mona-sidebar`, `.mona-tab`, `.mona-window`.
5. Se não existir componente, crie a classe em `semantic.css` (aninhada) e só então o React.

```tsx
// Certo
<Button variant="primary">Salvar</Button>
<div className="mona-card">…</div>

// Errado — a júnior não pinta página assim
<button className="bg-brand-800 text-white rounded-xl px-4 py-2">Salvar</button>
```

## Contrato de nome

| Padrão | Exemplo | Uso |
|--------|---------|-----|
| Bloco | `.mona-card` | Peça da UI |
| Modificador | `.mona-btn--primary` | Variante |
| Elemento | `.mona-field__label` | Parte do bloco |
| Estado | `.is-invalid`, `.is-client-locked` | Comportamento |

Prefixo sempre `mona-`. Não criar `.fv-*` novo.

**NestCSS:** aninhe `&:hover`, `&:disabled`, `&.is-invalid`.  
Não use `&__label` nem `&--primary` — o Tailwind 4 quebra isso (`:is(.mona-btn)--primary`). Escreva o nome da classe por extenso.

## Checklist antes de abrir PR

- [ ] Nenhum hex (`#006d69`) em `.tsx` de tela (hex de dado no estúdio/preset é exceção)
- [ ] Nenhuma cor Tailwind nova (`bg-emerald-50`, `text-red-600`) em tela
- [ ] Claro, escuro e presets funcionam sem `if (theme === 'dark')` no JSX
- [ ] Se criou token, ele tem par no tema escuro em `tokens.css`
- [ ] Se criou classe, ela está aninhada no bloco certo em `semantic.css`

## O que vem depois

- Sync da aparência em `/preferences/me`
- White-label completo (outro `data-tenant`)
- Accent por cliente no workspace
- Apagar `compat.css` quando as páginas antigas migrarem
