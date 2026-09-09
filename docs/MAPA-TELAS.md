# Mapa do que já está implementado (FattoVirtual)

Inventário fiel ao código atual. Serve para não perder nada ao evoluir para **plataforma multiempresa / Access Graph**.

Última atualização: 2026-08-10.

---

## Como ler

- **OK** = usável no dia a dia da Ju (ainda que POC em algum ponto).
- **POC** = fluxo existe, integração real limitada.
- **Base** = estrutura pronta; UX/regras ainda rasas vs briefing Access Graph.

---

## Rotas e telas

| Rota | Tela | Status | O que faz hoje |
|------|------|--------|----------------|
| `/login` | Login | OK | JWT + refresh |
| `/` | Dashboard | OK | KPIs + atalhos |
| `/operacao` | Modo operação | OK | Fila do dia + grupos de clientes |
| `/clientes` | Lista clientes | OK | Status, grupos, busca |
| `/clientes/:id` | Ficha cliente | OK | CRM timeline + financeiro 3 livros + baixa; apps, acessos, contrato, invoices, serviços |
| `/todos` | Tarefas | OK→evoluindo | Kanban + colunas editáveis, prazo, agenda, comentários |
| `/agenda` | Agenda | OK | Eventos, categorias, fuso, follow-up → tarefa |
| `/notificacoes` | Alertas | OK | Lido + resolver Early/OnTime/Late; lembretes agenda + atrasos |
| `/financeiro` | Financeiro | OK | Pagamentos; baixa com comprovante ou senha Ju/admin |
| `/contratos` | Contratos | Base | Lista + PDF |
| `/onboarding` | Onboarding | OK | Checklist incompleto + templates |
| `/prestadores` | Prestadores | Base | Cadastro + resumo |
| `/prestadores/:id` | Resumo prestador | Base | Clientes / pagamentos / escala |
| `/piramide` | Pirâmide | Base | Hierarquia ManagerId (owner) |
| `/parceiras` | Parceiras | Base | Cadastro |
| `/servicos` | Serviços | OK | Catálogo + especificidades + vínculo cliente |
| `/sops` (+ nova/editar/detalhe) | Procedimentos | OK | Hub situação, modo rápido/completo, overlays, métricas |
| `/apps` | Apps (catálogo) | Base | Catálogo de apps **do cliente** — não é o shell desktop |
| *(canal)* | Desktop `.exe` | OK | Electron empacota a mesma SPA; APIs `api/v1` iguais à web — ver [modulos/15-desktop.md](./modulos/15-desktop.md) |
| `/emails` | E-mails | POC | EmailKit (DevFile/SMTP; Gmail/Outlook stub) |
| `/whatsapp` | WhatsApp | Pronto host | status/webhook/send; Meta com a Ju |
| `/chat` | Chat página | OK | Direto, grupo, consigo, anexos ACL |
| *(widget)* | Chat flutuante | OK | Direto, consigo, anexos |
| `/compartilhar` | Portal contratante | OK | Gera link hub (msgs + docs + câmera) |
| `/s/:token` | Área do contratante | OK | Acompanhar, mensagens, upload foto/arquivo |
| `/configuracoes` | Configurações | OK | Hub **Pessoas e acessos** (criar logins), tipos, empresa, perfil, aparência (tema escuro Fatto) |
| `/faqs` | FAQs | Base | Lista/edição |

Workspace: abas dock/float, menu personalizável, fuso casa/viagem.

---

## Backend (API `api/v1`)

| Área | Controller / serviço |
|------|----------------------|
| Auth | login, refresh, me, verify-admin-password |
| Clientes + grupos | Clients, ClientGroups |
| Operação | Operations queue |
| Tarefas + colunas | Todos, TodoBoard |
| Agenda | Agenda + AgendaReminderBackgroundService |
| Alertas atrasados | TodoOverdueBackgroundService |
| Financeiro | Payments + settle proof/password |
| Contratos/parceiras/serviços/apps | Catalog |
| Onboarding | Onboarding + templates |
| SOPs | Sops + runs |
| E-mail / WhatsApp | Emails, WhatsApp + kits |
| Chat | Chat |
| Workspace | Preferences, notifications |
| Settings | Org, access-types, shared-users |
| Share | share-links + public |

---

## Domínio relevante (hoje)

`Organization` · `AccessType` · `AppUser` (1 org) · `Client` · `ClientGroup` · `Employee` · `TodoItem` · `TodoBoardColumn` · `AgendaEvent` · `AppNotification` · `Payment` · `Contract` · `ShareLink` · `Sop*` · `Chat*` · `PartnerCompany` · …

Escopo atual: **quase tudo `OrganizationId` + permissões de AccessType + AssignedClientIds**.

---

## O que ainda NÃO é Access Graph

| Conceito do briefing | Hoje |
|----------------------|------|
| Membership multi-org | ❌ 1 org por usuário |
| Equipes / grupos de acesso | ❌ (só AccessType + AssignedClientIds) |
| Terceiro como principal | ❌ PartnerCompany é catálogo |
| Compartilhar recurso (ACL) | ⚠ só ShareLink anônimo |
| Sensibilidade Owner-only | ❌ |
| Contrato N partes | ❌ 1 vínculo simples |
| Demanda → tarefas | ❌ só TodoItem |
| Portal cliente autenticado | ⚠ só `/s/:token` |
| Auditoria fina | ❌ |
| Authorize central | ⚠ ifs por permission claim |

**Regra de evolução:** refinar o que existe; não jogar fora. Novas tabelas (Membership, Team, ResourceShare…) entram **ao lado** e a UI migra aos poucos.

---

## Pacotes reutilizáveis

- `packages/EmailKit`
- `packages/WhatsAppKit`
- `desktop/` — shell Electron (mesmo frontend; ver [modulos/15-desktop.md](./modulos/15-desktop.md))
- `desktop/demo/` + `Iniciar-Demonstracao.bat` — sobe API/DB (Docker) e abre o `.exe`
- `docker-compose.desktop.yml` — stack mínima (db + api) para o desktop

---

## Docs irmãos

- Briefing original × gaps: [ALINHAMENTO-BRIEFING-ORIGINAL.md](./ALINHAMENTO-BRIEFING-ORIGINAL.md)
- Briefing alinhamento Ju + Access Graph: [BRIEFING-ALINHAMENTO-JU.md](./BRIEFING-ALINHAMENTO-JU.md)
- Perguntas por aba: [modulos/README.md](./modulos/README.md)
- Integrações: [INTEGRATIONS.md](./INTEGRATIONS.md)
- Desktop `.exe`: [modulos/15-desktop.md](./modulos/15-desktop.md)
