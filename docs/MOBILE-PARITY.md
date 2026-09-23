# MONA — contrato de paridade responsiva

## Diagnóstico

O projeto usa React 19, React Query, Vite e API ASP.NET. O shell mobile é ativado abaixo de 768px. A identidade atual vem de `tokens.css`, classes de `semantic.css` e personalização de `shared/theme`. As imagens fornecidas são referências visuais, não instruções embutidas.

As árvores separadas `mona-mobile-only` / `mona-desktop-only` omitiam controles e reduziam listas no celular. Exemplos: tarefas sem comentários, agendamento ou colunas; financeiro sem baixa; agenda sem categorias e follow-up; configurações sem pessoas/empresa; WhatsApp com filtro de não lidas simulado e editor oculto. O endpoint de reordenação de colunas existia sem interface correspondente.

## Matriz de interface

| Aba | Recursos que devem estar disponíveis em ambos os tamanhos |
| --- | --- |
| Dashboard | Indicadores, atalhos, tarefas e agenda do dia, operação e relatórios |
| Operação | Fila completa, filtros, grupos, criação de grupo e links de contexto |
| Tarefas | Responsável, período, colunas, criação, conclusão, movimentação, contexto, comentários e agenda |
| Agenda | Eventos, categorias, filtros de visualização, fusos, responsáveis e follow-up |
| Clientes / ficha | Busca, grupos, status, cadastro e todas as abas da ficha, edição e ações permitidas |
| Prestadores / parceiras / serviços | Listas completas, busca, cadastro, edição e ações por permissão |
| Financeiro | Livros, totais, filtros, movimentos, vínculos e baixa |
| Contratos | Filtros, documentos, upload e ações disponíveis |
| Onboarding | Todos os clientes, checklists, templates e setup guiado |
| Procedimentos | Biblioteca, busca, áreas, criação, edição e execução |
| E-mails | Contas, pastas, mensagens, leitura e programação de envio |
| WhatsApp | Entrada, resposta, cliente e composição; respeitar o estado demo da integração |
| Relatórios | Seletores, filtros e resultados completos |
| Portal contratante | Clientes, links, criação e gestão dos acessos |
| Configurações | Pessoas e acessos, tipos de acesso, empresa, perfil e aparência; Desktop/API somente no aplicativo |
| Apps / FAQs / pirâmide / alertas / chat | Rotas, detalhes e ações existentes, sem perda por tamanho da tela |

## Regras de apresentação

Uma árvore funcional compartilhada por aba, com layout adaptado. No celular, cabeçalho compacto com identidade MONA, controles de toque, tabelas de gestão em cartões rotulados e diálogos em painel inferior. O dashboard pode manter composição própria por ser um resumo com caminhos para os módulos.

No quadro, a coluna é uma superfície delimitada com cor, título, quantidade e ações. A ordem é persistida no servidor; botões acessíveis complementam arraste. Rolagem horizontal fica restrita ao quadro no desktop; no celular as colunas se empilham.

## Validação

Validação da integração com `origin/Front` em 23/09/2026:

- `npx vite build`: aprovado; é o mesmo comando usado pelo Dockerfile de produção.
- `npx tsc -p tsconfig.app.json --pretty false`: aprovado após remover código sem uso da landing recebida do remoto.
- `npx oxlint src`: sem erros; permanecem avisos existentes de Fast Refresh e dependências de efeito.
- `dotnet test backend/tests/FattoVirtual.Api.Tests/FattoVirtual.Api.Tests.csproj --no-restore`: 16 testes aprovados. Inclui persistência da ordem das colunas, isolamento por organização e rejeição de listas incompletas, duplicadas ou nulas sem alteração parcial.
- Navegador local com fake API: editor de colunas em 390px, ordem salva e preservada após recarregar, quadro em 320px e desktop em 1440px. Medição de largura da página em 767/768px sem transbordamento horizontal do documento.

Pendências anteriores de ferramentas: `npm run build` inclui a API simulada, que ainda apresenta erros de tipagem em seus dados mutáveis; `npm run lint` inclui `.tmp-screens/shot-notch.cjs`, um script antigo com `await` fora de módulo. A restauração NuGet também reporta aviso NU1903 para Microsoft.OpenApi 2.0.0. Esses resultados não equivalem a aprovação desses comandos completos.

Ambiente Vite padrão usa `fake-api`; integração real exige `dev:api` e backend disponível. A conferência visual e os testes acima não certificam todos os fluxos de produção nem substituem uma rodada completa por perfil de acesso.
