---
name: mona-responsive-parity
description: >-
  Adapta e confere paridade entre celular e desktop no MONA: shell, navegação,
  abas, formulários, tabelas e quadro de tarefas. Use quando o pedido citar
  mobile, responsivo, celular, dock, breakpoint ou layout abaixo de 768px.
---

# Paridade responsiva MONA

O modo mobile é uma classe React, não uma media query.

`app/AppLayout.tsx` faz `window.innerWidth < 768` e aplica `.mona-shell.is-mobile` e `.mona-sidebar.is-mobile-dock`. O CSS do app em `semantic.css` depende dessas classes. Uma `@media (max-width: 767px)` nova no app dessincroniza do shell. A landing é a exceção: `landing.css` usa `@media` em 767px e 900px.

Leia `docs/MOBILE-PARITY.md`, `app/router.tsx` e `shared/nav/navConfig.ts` no fluxo afetado. A skill `mona-design-edit` vale para cor e componente.

## Regras

- Uma árvore funcional para os dois modos. O mobile não esconde filtro, registro, ação, permissão, detalhe ou erro que o desktop mostra. Resumo curto só com caminho explícito para a lista completa.
- Preserve o desktop. Não force todo grid ou tabela para cartão. Use a classe do componente e o seletor `.mona-shell.is-mobile`.
- Tabelas de gestão: `.mona-data-table` e `data-label` em cada `td`, com as mesmas ações. Tabelas comparativas rolam numa região nomeada, sem alargar a página.
- Colunas de tarefas: persistir com `POST /todo-board/columns/reorder` e corpo `{ ids }`. Arraste precisa de botões para toque e teclado. Em falha, restaurar a ordem anterior e bloquear reorder concorrente enquanto salva.
- Modal: um título, foco preso, Escape, foco devolvido, rolagem interna, área segura. Texto de campo com pelo menos 16px no mobile. Alvo de toque com 44px (`--mona-control-h`).
- Navegação cobre cada rota permitida, respeita preferência de menu e mantém Configurações, Chat e Alertas alcançáveis. Perfil somente leitura não ganha ação de escrita.
- Abaixo de 768px, abas não flutuam (`matchMedia('(min-width: 768px)')` em `AppLayout.tsx`).

## Conferência

Suba `npm run dev` em `frontend`. Percorra a tela em 390px, 767px, 768px e desktop com várias abas. Nos dois lados do corte, a classe `is-mobile` tem de coincidir com a largura. Exercite criar, abrir detalhe, filtrar, comentar, agendar e reordenar; recarregue e confira persistência. A fake API reproduz o contrato local e não prova produção.
