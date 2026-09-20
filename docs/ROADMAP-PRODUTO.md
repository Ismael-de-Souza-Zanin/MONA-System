# FattoVirtual — diagnóstico e roadmap de produto

Revisão: 19/09/2026. Base: código local, documentação existente e comparativo enviado pelo usuário. Este é um inventário de implementação; não certifica implantação, uso real ou prontidão de produção.

## Maior lacuna

**Fechar uma operação confiável de ponta a ponta: solicitação → cliente → responsável/prazo → execução/SOP → evidência → retorno ao cliente.**

Já existe uma base ampla. O principal trabalho agora é conectar os módulos, ativar os canais reais e garantir que cada pessoa veja dados consistentes do seu contexto. Uma solicitação ainda pode ficar solta na caixa de mensagens; o relatório e a fila não comprovam sozinhos que ela foi atendida.

O diferencial a desenvolver é operar o negócio do cliente, além de administrar a agência: ficha contextual, SOP executável, decisões e dinheiro do cliente separado da receita da Fatto e do repasse da VA. Isso é uma direção de produto, não uma exclusividade de mercado comprovada.

## Como interpretar o levantamento

- **Implementado:** há interface e API persistente correspondentes; ainda exige validação do fluxo no ambiente real.
- **Parcial:** parte do fluxo existe, mas faltam etapas, controles ou integração.
- **POC:** demonstração/adaptador inicial, sem comprovação do canal real completo.
- **Não encontrado:** não foi localizada implementação no código examinado; não significa impossibilidade de integrar.

`npm run dev` utiliza `frontend/fake-api`; `npm run dev:api` e o build de produção utilizam a API real. Uma tela funcionar na demonstração não comprova integração ou persistência em produção.

## Onde estamos e o que temos

Os caminhos abaixo são relativos à raiz do repositório. As evidências apontam os arquivos principais, não uma auditoria exaustiva.

| Capacidade do comparativo | Estado local | Evidência / limite |
|---|---|---|
| Clientes, status, grupos, ficha | Implementado | `ClientsController.cs`, `ClientDetailPage.tsx`; regras de mudança de status ainda precisam de validação operacional |
| Tarefas, prioridades, Kanban, comentários | Implementado | `TodosController.cs`, `TodoBoardController.cs`, `TodosPage.tsx` |
| Projetos | Não encontrado como entidade própria | Organização atual por cliente, serviço, tarefa e agenda; validar necessidade antes de criar outro módulo |
| Tempo e horas por cliente | Parcial | `TimeAttendanceController.cs`, `TimeEntry.cs`; lançamento manual, sem cronômetro completo nem aprovação de horas |
| Pacote de horas | Parcial | `Client.RetainerHoursPerMonth`, relatórios; sem renovação, rollover, excedente faturado ou alerta automático de consumo |
| Portal do cliente | Implementado via link | `PublicPortalController.cs`, `ContractorPortalPage.tsx`; token, validade/escopos, mensagens, documentos e resumo; não é login autenticado multiempresa |
| Comunicação com cliente | Parcial | Portal persistente; e-mail/WhatsApp com limitações descritas abaixo |
| Documentos e contratos | Parcial | Upload/documentos, cadastro e PDF de contratos; não há jornada completa de negociação/assinatura |
| SOPs e processos | Implementado | `SopsController.cs`, `SopsPages.tsx`; passos, execução, scripts e adaptações por cliente/serviço |
| Assinatura eletrônica | Não encontrada | Não confundir contrato PDF com assinatura eletrônica |
| Invoices | Parcial | `Invoice.cs` e ficha do cliente; cadastro não equivale a faturamento automático |
| Cobrança recorrente e pagamento online | Não encontrados completos | Lançamentos e baixa manual existem; não foi encontrado ciclo de cobrança recorrente com provedor e conciliação |
| Multi-moeda | Não encontrada completa | Interface de relatórios formata BRL; não há conversão ou consolidação por moeda |
| Financeiro e relatórios | Parcial | `FinanceController.cs`, `ReportsController.cs`; planos A/B/C, baixa com evidência e relatório operacional |
| Rentabilidade por cliente | Parcial | Diferença B − C dos lançamentos liquidados e vinculados; não é lucro contábil nem custo completo por cliente |
| Equipe e login de VA | Implementado | Pessoas/acessos, permissões, clientes atribuídos e prestadores; sem membership multiempresa |
| Payroll / pagamento da VA | Parcial | Livro `AssistantPayout`; sem processamento automático de folha ou transferência bancária |
| Agenda e reuniões | Implementado internamente | `AgendaController.cs`; decisões podem gerar tarefas; sincronização externa ainda tem `NullExternalCalendarProvider` |
| Booking do cliente | Não encontrado | Agenda interna não equivale a página pública de disponibilidade/reserva |
| CRM | Parcial | Timeline, estágio de relacionamento e próxima ação; não é pipeline comercial completo |
| Automação | Parcial | Lembretes, alertas de atraso, envio programado e decisão → tarefa; sem motor geral de regras |
| IA | Não encontrada integrada | Não priorizar antes de haver dados e fluxo rastreáveis |
| Monitoramento / screenshots | Não encontrado | Sem demanda demonstrada que justifique priorizar sobre evidência de entrega |
| White-label / domínio por organização | Não encontrados completos | Temas e marca não equivalem a white-label com domínio por cliente |
| Stripe / Wise / QuickBooks / Slack | Não encontrados completos | Não considerar API interna como integração entregue |
| WhatsApp | POC/parcial | `WhatsAppController.cs`, `packages/WhatsAppKit`; inbox demo e webhook inbound ainda inicial |
| E-mail | POC/parcial | `EmailsController.cs`, `packages/EmailKit`; demo e envio programado; Gmail/Outlook não são caixas produtivas completas |
| API / integrações empresariais | Parcial | API REST interna, JWT e kits; faltam contrato público/versionamento operacional, credenciais de integração e webhooks de saída |
| Operar o negócio do cliente | Parcial, direção forte | Ficha, financeiro A, SOPs e decisões existem; falta consolidar o atendimento como fluxo rastreável |

Controllers: `backend/src/FattoVirtual.Api/Controllers/`. Entidades: `backend/src/FattoVirtual.Domain/Entities/`. Telas: `frontend/src/features/`.

## O que o comparativo realmente orienta

O comparativo original está preservado em [COMPARATIVO-VA-FORNECIDO.md](./COMPARATIVO-VA-FORNECIDO.md). As classificações dos sete fornecedores são informações fornecidas, não resultados de testes nossos.

Consulta pública pontual em 19/09/2026: [FocalVA](https://focalva.com/) se apresenta na busca como plataforma de gestão de clientes para VAs; [VA Hub](https://www.vahub.cloud/) descreve gestão de agência, billing, acompanhamento e integrações. Isso sustenta a relevância dessas categorias, mas não valida todos os checkmarks, disponibilidade por plano ou a afirmação absoluta de que nenhum concorrente opera o negócio do cliente. Revalidar cada fornecedor antes de usar o quadro em material comercial.

## Roadmap priorizado

Esforço relativo: **P** = ajuste localizado; **M** = fluxo que envolve várias telas/API; **G** = integração externa ou mudança estrutural. Não são prazos prometidos. Ordem proposta para uma equipe pequena, com foco no uso diário da Ju.

| ID / ordem | Entrega | Impacto | Esforço | Dependência | Critério de conclusão |
|---|---|---|---|---|---|
| Q1 · agora | Relatórios coerentes e restritos ao contexto | Alto | P–M | Base atual | Cliente filtrado sem registros sem vínculo; VA sem repasse de colega; valores financeiros serializados; semana de 7 dias |
| Q2 · agora | Fila com busca, filtros e urgência | Alto | P | Fila atual | Encontrar pendências por cliente/tipo/texto, limpar filtros e distinguir fila vazia de erro |
| Q3 · agora | Feedback e validação dos lançamentos | Alto | P | Relatórios atuais | Erros visíveis; minutos inválidos e pacote vazio não enviados; ações respeitam permissões da interface |
| P0.1 · próxima rodada | Revisão de acesso em todos os endpoints de operação, decisões, horas e pontos de atendimento | Alto | M | Perfis reais de Ju/VA/cliente | Testes entre organizações, entre clientes e entre VAs; consultas e alterações sem acesso rejeitadas |
| P0.2 · próxima rodada | Piloto com API/banco reais | Alto | M | Ambiente e contas de teste | Uma entrada até entrega/portal, persistência após reinício, baixa de teste e restauração de backup verificadas |
| P0.3 · próxima rodada | Recuperar build/lint gerais e revisar dependência sinalizada | Alto | P–M | Tipos da fake API e configuração de lint | `npm run build` e `npm run lint` passam; revisar alerta NU1903 de `Microsoft.OpenApi` identificado no build inicial |
| P1.1 · primeiro ciclo funcional | Entrada manual/portal → tarefa com origem | Alto | M | P0.1; tarefa e portal atuais | Solicitação tem cliente, responsável, prazo, vínculo com mensagem/origem e estado; conversão repetida não duplica tarefa |
| P1.2 · primeiro ciclo funcional | Histórico e conclusão comprovável | Alto | M | P1.1 | Tarefa com data de conclusão própria, evidência e próximo passo; relatório reproduz o período sem depender de `UpdatedAt` |
| P1.3 · primeiro ciclo funcional | Exibir e editar SLA, intake e escalonamento já modelados | Alto | P–M | `AttendancePoint`; validações de acesso | Equipe configura janela, o que coletar e para quem encaminhar, por cliente/serviço |
| P1.4 · primeiro ciclo funcional | Pacote mensal com saldo e faixas de consumo | Médio/alto | M | Definir horas faturáveis, fuso e ciclo | Consumo, saldo e excedente consistentes; alerta em 80%/100% sem notificações duplicadas |
| P1.5 · primeiro ciclo funcional | Decisão → tarefa com responsável e prazo na interface | Alto | P–M | API já possui campos; revisar autorização | Prazo e responsável acompanham a tarefa; fechamento rastreável na decisão |
| P2.1 · segundo ciclo | Um canal real ponta a ponta (WhatsApp OU e-mail) | Alto | G | Escolher canal do piloto e credenciais do provedor | Receber, persistir, vincular cliente, criar trabalho, responder e tratar falhas/retries; sem dados demo |
| P2.2 · segundo ciclo | Resumo de entrega no portal | Alto | M | P1.2 e regras de visibilidade | Cliente vê entregas, pendências que dependem dele e decisões liberadas; nunca repasse/margem internos |
| P2.3 · segundo ciclo | Recorrência operacional e financeira controlada | Médio/alto | M–G | Definir ciclo, cancelamento e idempotência | Tarefas/cobranças geradas uma vez por ciclo; exceções e falhas recuperáveis |
| P3 · após piloto | Assinatura, cobrança online, calendário externo | Conforme demanda | G | Provedores e fluxo já validado | Integração comprovada em sandbox e regras de conciliação/retentativa |
| P4 · expansão | Membership multiempresa, white-label, API pública e IA assistiva | Estratégico | G | Uso estável, isolamento e necessidade comercial | Escopo e custo confirmados; sem substituir o fluxo operacional existente |

### Primeiro fluxo de referência

1. Solicitação chega pelo portal (ou registro manual enquanto o canal real não está pronto).
2. Equipe identifica cliente, serviço, responsável e prazo; registra origem.
3. Tarefa usa SOP quando necessário; agenda continua sendo compromisso, com vínculo opcional.
4. Execução registra tempo, decisão e evidência sem misturar os livros financeiros.
5. Equipe conclui e o cliente acompanha somente o conteúdo liberado.

Medir no piloto: solicitações sem responsável/prazo; solicitações sem próximo passo; tempo entre entrada e primeiro atendimento; conclusão no prazo; entregas com evidência; consumo mensal; tempo gasto para produzir o resumo ao cliente. Estabelecer uma linha de base antes de prometer metas numéricas.

## Entregas desta rodada

- **Q1 implementado:** validação de lente/período; cliente validado no escopo; exclusão de registros sem cliente quando há filtro; agregados por cliente seguem a lente da VA; SOPs/decisões filtrados; repasse da VA restrito a `TargetUserId`; sem margem na lente VA/cliente; totais financeiros usam propriedades serializáveis; semana com sete dias; consumo mensal considera tempo faturável com cliente.
- **Q2 implementado:** busca, filtro por cliente/tipo, ordenação por urgência/atraso/prazo, limpeza e contagem dos itens carregados; horário usa o fuso retornado pela API. Os filtros operam sobre o lote retornado; não são busca global de todo o histórico.
- **Q3 implementado:** erro/retry na fila e relatórios; erros de criação/lançamento visíveis; validação de minutos/pacote; formulários conforme permissões; retorno da seleção de cliente e atualização de caches após decisão.
- **Validação concluída:** 11 testes de regressão aprovados em `backend/tests/FattoVirtual.Api.Tests/ReportsTests.cs`; compilação TypeScript do aplicativo (`tsconfig.app.json`), lint dos três arquivos frontend alterados e empacotamento Vite aprovados. Interface verificada na demonstração: busca sem resultados, limpeza, filtros combinados cliente/tipo, relatório por cliente, bloqueio de minutos zero e de pacote vazio.

### Limites da validação desta rodada

- Testes do controller usam EF InMemory e serialização JSON. Não substituem testes HTTP/JWT nem tradução das consultas no PostgreSQL; o Docker local não estava acessível ao ambiente de execução.
- `npm run build` completo falha em problemas de tipagem já presentes em `frontend/fake-api/handlers.ts` antes das alterações desta rodada (por exemplo, campos `createdAt`, `completedAtUtc` e objetos inferidos a partir do seed). A API fake recebeu apenas ajustes de semana, filtro de cliente e consumo mensal, sem uma reestruturação de todos os tipos.
- `npm run lint` completo falha em `.tmp-screens/shot-notch.cjs` com `await` fora de função async e apresenta avisos existentes de Fast Refresh. O lint dos arquivos alterados passou.
- Vite sinaliza bundle acima de 500 kB; o build inicial do backend sinalizou NU1903 em `Microsoft.OpenApi` 2.0.0 e avisos NU1510. Estes itens foram registrados para a próxima rodada, sem atualização indiscriminada de dependências.
- Não houve implantação nem alteração do banco de produção. A validação de interface usou dados fictícios.

## Limites e decisões ainda abertas

- Correções desta rodada não equivalem a auditoria completa de autorização. P0.1 permanece necessário, inclusive nos endpoints que recebem IDs de entidades relacionadas.
- Períodos dos relatórios continuam em UTC, agora explícito na tela; definir se o período deve seguir o fuso da organização antes de mudar essa regra.
- Conclusões ainda usam `TodoItem.UpdatedAt`; uma edição posterior pode deslocar uma entrega entre períodos. Criar `CompletedAtUtc` com regra de reabertura em P1.2.
- Margem mostrada é B − C liquidado no período e no escopo consultado. Não inclui despesas gerais, impostos ou rateio de repasses sem cliente.
- Repasse próprio exige `TargetUserId`; cadastros antigos com apenas `EmployeeId` precisam de conciliação explícita, sem presumir que todo prestador é a VA atual.
- Consumo mensal nesta rodada = horas faturáveis vinculadas a cliente, no mês UTC; na lente VA, apenas as horas dessa VA. Renovação, rollover e cobrança do excedente permanecem pendentes.
- Validar com Ju durante o piloto: principal canal de entrada, regra de consumo de horas, limites de aprovação e qual conteúdo pode aparecer no portal. Essas respostas não bloqueiam as melhorias locais já feitas.

## Como verificar

```powershell
dotnet test backend/tests/FattoVirtual.Api.Tests/FattoVirtual.Api.Tests.csproj
cd frontend
npm run build
npm run lint
```

Para validar persistência e integrações, utilizar `npm run dev:api` com banco/API de teste. A demonstração serve para verificar a interface; não testa o isolamento da API real.
