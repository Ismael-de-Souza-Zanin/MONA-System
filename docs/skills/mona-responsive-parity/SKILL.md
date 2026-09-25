---
name: mona-responsive-parity
description: Implementar e verificar paridade entre celular e desktop na aplicação MONA/FattoVirtual, incluindo navegação, abas, formulários, tabelas e quadro de tarefas.
---

# Paridade responsiva MONA

Use no frontend deste repositório. Consulte `docs/MOBILE-PARITY.md`, `app/router.tsx`, `shared/nav/navConfig.ts` e os componentes de cada fluxo afetado.

- O shell troca para mobile abaixo de 768px. Mantenha esse limite consistente com CSS. Teste também 767/768px, 320/390px e desktop com várias abas abertas.
- Prefira uma árvore funcional compartilhada. Uma apresentação mobile não pode suprimir filtros, registros, ações, permissões, detalhes ou estados de erro existentes no desktop. Resumos limitados só são adequados quando há acesso claro à lista completa.
- Tabelas de gestão usam `.mona-data-table` e `data-label` nas células para cartões no celular, mantendo as mesmas ações e registros. Tabelas comparativas podem rolar dentro de uma região identificada, sem aumentar a largura da página.
- Colunas de tarefas persistem por `POST /todo-board/columns/reorder` com `{ ids }`. Arraste deve ter alternativa por botões para toque e teclado. Informe falha, restaure a ordem anterior e bloqueie operações conflitantes enquanto salva.
- Modais devem ter título único, foco contido, Escape, restauração do foco, rolagem interna e área segura do celular. Campos de texto com pelo menos 16px no mobile evitam zoom; controles de toque precisam de 44px.
- A navegação deve cobrir cada rota permitida, respeitar preferências de menu e manter Configurações, Chat e Alertas acessíveis. Não exponha ações de escrita a perfis somente leitura.
- Preserve o desktop ao adaptar mobile. Não transforme todos os grids/tabelas indiscriminadamente: use classes de componente e media queries delimitadas.

Execute `npm run build` e `npm run lint` em `frontend`. Verifique interações reais: criação, detalhes, troca de filtros, comentários, agendamento, reordenação e persistência após recarregar. A fake API serve para validação local e precisa reproduzir o contrato alterado; não prova integração de produção.
