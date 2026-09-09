# Mapa de páginas e funcionalidades — FattoVirtual

Inventário para revisão da equipe. Status: **OK** (usável) · **POC** (fluxo existe, integração limitada) · **Base** (estrutura pronta, UX a aprofundar).

Atualizado: 2026-08-10.

---

## Workspace (todas as telas autenticadas)

- Menu lateral personalizável + recolhível  
- Abas dock / flutuantes (arrastar, clique direito: fechar, flutuar, etc.)  
- Fuso casa / viagem · tema claro/escuro (identidade verde Fatto)  
- Chat flutuante · central de alertas · sair  

---

## Páginas

| Rota | Página | Status | Funcionalidades principais |
|------|--------|--------|----------------------------|
| `/login` | Login | OK | JWT + refresh |
| `/` | Dashboard | OK | KPIs empresa/usuário, atalhos |
| `/operacao` | Modo operação | OK | Fila do dia, grupos de clientes |
| `/clientes` | Clientes | OK | Lista, status (cores), busca, grupos, adicionar |
| `/clientes/:id` | Ficha cliente | OK | Resumo, apps, acessos, CRM, financeiro 3 livros, contrato, invoices, serviços, portal |
| `/todos` | Tarefas | OK | Kanban, colunas, prazo, comentários, vínculo agenda |
| `/agenda` | Agenda | OK | Eventos, categorias, fuso, lembretes |
| `/notificacoes` | Alertas | OK | Lido, resolução Early/OnTime/Late |
| `/financeiro` | Financeiro | OK | 3 livros, vínculos (tarefas/agenda/SOP…), baixa (comprovante ou senha admin) |
| `/contratos` | Contratos | Base | Lista + PDF |
| `/onboarding` | Onboarding | OK | Checklist + templates |
| `/prestadores` | Prestadores | Base | Cadastro + lista |
| `/prestadores/:id` | Resumo prestador | Base | Clientes, pagamentos, escala |
| `/piramide` | Pirâmide | Base | Hierarquia (conta principal) |
| `/parceiras` | Parceiras | Base | Cadastro empresas parceiras |
| `/servicos` | Serviços | OK | Catálogo, especificidades, vínculo cliente |
| `/sops` | Procedimentos | OK | Hub, pesquisa, modo rápido/completo, overlays, métricas, scripts |
| `/apps` | Apps (catálogo) | Base | Links de apps usados com clientes |
| `/emails` | E-mails | POC | Agendamento / outbox (DevFile/SMTP) |
| `/whatsapp` | WhatsApp | POC host | Status, webhook stub, send (Meta = configuração Fatto) |
| `/chat` | Chat interno | OK | Direto, grupo, consigo, anexos com ACL |
| `/compartilhar` | Portal contratante | OK | Gerar/revogar links, ACL (msgs, upload, contato) |
| `/s/:token` | Área do contratante | OK | Hub público: acompanhar, mensagens, upload/câmera |
| `/configuracoes` | Configurações | OK | Empresa, perfil, tipos de acesso, **pessoas/logins**, aparência, API desktop |
| `/faqs` | FAQs | Base | Perguntas frequentes |
| *(desktop)* | App Windows `.exe` | OK | Mesma UI + mesmas APIs |

---

## Canais

| Canal | Como |
|-------|------|
| Web (dev) | Vite / Docker `web` → API `:5080` |
| Desktop | `entregavel/app/*.exe` → API `:5080` |
| Portal contratante | Link `/s/{token}` sem login de equipe |

---

## Áreas de API (`/api/v1`)

Auth · Clientes/grupos · Operação · Tarefas · Agenda · Financeiro · Catálogo (parceiras/serviços/contratos/apps) · Onboarding · SOPs · E-mail · WhatsApp · Chat · Preferências/alertas · Configurações · Share links · Público portal  

Validação automática: `entregavel/scripts/02-Validar-Endpoints.ps1`.
