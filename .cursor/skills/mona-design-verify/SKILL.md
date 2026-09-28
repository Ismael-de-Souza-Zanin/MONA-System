---
name: mona-design-verify
description: >-
  Confere no browser uma mudança visual do MONA antes de encerrar: tema claro
  e escuro, preset personalizado, breakpoint 768px e a interação da tela.
  Use depois de editar CSS, layout, tema ou componente de interface.
---

# Verificação visual MONA

Não encerre uma mudança de interface com um print estático. Confirme o comportamento.

## Preparar

1. `npm run dev` em `frontend`.
2. Se a mudança está em `tokens.css` ou `presets.ts`, limpe `localStorage.mona_appearance_v1` ou use Restaurar em Configurações → Aparência. Sem isso o override inline esconde o token novo.
3. Abra a rota do `features/` alterado e uma segunda rota que reuse a mesma classe (`Button`, `.mona-card`, `.mona-sidebar`, `.mona-tab`, `.mona-data-table`).

## O que olhar

- **MONA claro** (`fatto-light`) e **MONA escuro** (`fatto-dark`). Texto, borda e superfície têm de continuar legíveis. Sem `if (theme === 'dark')` novo no JSX.
- Se o valor passa por `applyAppearance`, repita num preset diferente (Oceano ou Studio areia). O default sozinho não prova que o token personalizável ficou certo.
- Larguras: 390px, 767px, 768px e desktop (~1280px). Abaixo de 768 o shell tem `.is-mobile`; em 768 não tem. Landing: 767px e 900px.
- Interação da peça: hover, foco, ativo, vazio, erro, modal (Escape e rolagem), aba, notch no item ativo da sidebar.
- Medidas de referência: controle 44px, raio do cartão `--mona-radius-lg`, título em `--mona-font-display`. Não introduza hex nem utilitário de cor Tailwind na tela.

## Falhou

Corrija e repita o mesmo percurso. Diga o que foi exercitado no browser e o que ficou sem servidor real. Build (`npm run build`) e lint (`npm run lint`) em `frontend` acompanham a verificação visual; não a substituem.
