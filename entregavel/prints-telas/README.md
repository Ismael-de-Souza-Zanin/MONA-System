# Prints de tela — FattoVirtual

Pasta para análise de identidade visual, tela a tela.

- Ambiente: containers `db` + `api` + `web` em http://127.0.0.1:5173
- Viewport: 1440×900, página inteira (scroll)
- Login: `ju@fattovirtual.com`
- Tema: claro (identidade verde Fatto)
- Ficha do cliente: Ana Paula (Nail Desigmax)
- Sem ficha de prestador: o seed local não tem prestadores cadastrados (só a lista vazia, `11-prestadores.png`)

Para recapturar: com os containers no ar, rode `node entregavel/scripts/capturar-prints-telas.mjs`.

| # | Arquivo | Tela | URL |
|---|---------|------|-----|
| 1 | [01-login.png](./01-login.png) | Login | http://127.0.0.1:5173/login |
| 2 | [02-dashboard.png](./02-dashboard.png) | Dashboard | http://127.0.0.1:5173/ |
| 3 | [03-operacao.png](./03-operacao.png) | Modo operação | http://127.0.0.1:5173/operacao |
| 4 | [04-clientes.png](./04-clientes.png) | Clientes | http://127.0.0.1:5173/clientes |
| 5 | [05-tarefas.png](./05-tarefas.png) | Tarefas | http://127.0.0.1:5173/todos |
| 6 | [06-agenda.png](./06-agenda.png) | Agenda | http://127.0.0.1:5173/agenda |
| 7 | [07-alertas.png](./07-alertas.png) | Alertas | http://127.0.0.1:5173/notificacoes |
| 8 | [08-financeiro.png](./08-financeiro.png) | Financeiro | http://127.0.0.1:5173/financeiro |
| 9 | [09-contratos.png](./09-contratos.png) | Contratos | http://127.0.0.1:5173/contratos |
| 10 | [10-onboarding.png](./10-onboarding.png) | Onboarding | http://127.0.0.1:5173/onboarding |
| 11 | [11-prestadores.png](./11-prestadores.png) | Prestadores | http://127.0.0.1:5173/prestadores |
| 12 | [12-piramide.png](./12-piramide.png) | Pirâmide | http://127.0.0.1:5173/piramide |
| 13 | [13-parceiras.png](./13-parceiras.png) | Empresas parceiras | http://127.0.0.1:5173/parceiras |
| 14 | [14-servicos.png](./14-servicos.png) | Serviços | http://127.0.0.1:5173/servicos |
| 15 | [15-procedimentos.png](./15-procedimentos.png) | Procedimentos (SOPs) | http://127.0.0.1:5173/sops |
| 16 | [16-procedimento-novo.png](./16-procedimento-novo.png) | Novo procedimento | http://127.0.0.1:5173/sops/nova |
| 17 | [17-apps.png](./17-apps.png) | Catálogo de apps | http://127.0.0.1:5173/apps |
| 18 | [18-emails.png](./18-emails.png) | E-mails | http://127.0.0.1:5173/emails |
| 19 | [19-whatsapp.png](./19-whatsapp.png) | WhatsApp | http://127.0.0.1:5173/whatsapp |
| 20 | [20-chat.png](./20-chat.png) | Chat interno | http://127.0.0.1:5173/chat |
| 21 | [21-portal-links.png](./21-portal-links.png) | Portal do contratante (links) | http://127.0.0.1:5173/compartilhar |
| 22 | [22-faqs.png](./22-faqs.png) | FAQs | http://127.0.0.1:5173/faqs |
| 23 | [23-config-pessoas.png](./23-config-pessoas.png) | Configurações — Pessoas e acessos | http://127.0.0.1:5173/configuracoes?tab=people |
| 24 | [24-config-tipos-acesso.png](./24-config-tipos-acesso.png) | Configurações — Tipos de acesso | http://127.0.0.1:5173/configuracoes?tab=access |
| 25 | [25-config-empresa.png](./25-config-empresa.png) | Configurações — Empresa | http://127.0.0.1:5173/configuracoes?tab=org |
| 26 | [26-config-perfil.png](./26-config-perfil.png) | Configurações — Meu perfil | http://127.0.0.1:5173/configuracoes?tab=user |
| 27 | [27-config-aparencia.png](./27-config-aparencia.png) | Configurações — Aparência | http://127.0.0.1:5173/configuracoes?tab=appearance |
| 28 | [28-cliente-resumo.png](./28-cliente-resumo.png) | Ficha do cliente — Resumo (Ana Paula) | http://127.0.0.1:5173/clientes/31ca9511-8258-407d-899d-d5f8377e55a7 |
| 29 | [29-cliente-apps.png](./29-cliente-apps.png) | Ficha do cliente — Aplicativos (Ana Paula) | http://127.0.0.1:5173/clientes/31ca9511-8258-407d-899d-d5f8377e55a7 |
| 30 | [30-cliente-acessos.png](./30-cliente-acessos.png) | Ficha do cliente — Acessos (Ana Paula) | http://127.0.0.1:5173/clientes/31ca9511-8258-407d-899d-d5f8377e55a7 |
| 31 | [31-cliente-crm.png](./31-cliente-crm.png) | Ficha do cliente — CRM (Ana Paula) | http://127.0.0.1:5173/clientes/31ca9511-8258-407d-899d-d5f8377e55a7 |
| 32 | [32-cliente-portal.png](./32-cliente-portal.png) | Ficha do cliente — Portal (Ana Paula) | http://127.0.0.1:5173/clientes/31ca9511-8258-407d-899d-d5f8377e55a7 |
| 33 | [33-cliente-financeiro.png](./33-cliente-financeiro.png) | Ficha do cliente — Financeiro (Ana Paula) | http://127.0.0.1:5173/clientes/31ca9511-8258-407d-899d-d5f8377e55a7 |
| 34 | [34-cliente-contrato.png](./34-cliente-contrato.png) | Ficha do cliente — Contrato (Ana Paula) | http://127.0.0.1:5173/clientes/31ca9511-8258-407d-899d-d5f8377e55a7 |
| 35 | [35-cliente-invoices.png](./35-cliente-invoices.png) | Ficha do cliente — Invoices (Ana Paula) | http://127.0.0.1:5173/clientes/31ca9511-8258-407d-899d-d5f8377e55a7 |
| 36 | [36-cliente-servicos.png](./36-cliente-servicos.png) | Ficha do cliente — Serviços (Ana Paula) | http://127.0.0.1:5173/clientes/31ca9511-8258-407d-899d-d5f8377e55a7 |
| 37 | [37-cliente-parceiros.png](./37-cliente-parceiros.png) | Ficha do cliente — Parceiros (Ana Paula) | http://127.0.0.1:5173/clientes/31ca9511-8258-407d-899d-d5f8377e55a7 |
| 38 | [38-procedimento-detalhe.png](./38-procedimento-detalhe.png) | Procedimento — detalhe (Cliente não respondeu) | http://127.0.0.1:5173/sops/931a3eca-36bb-4bfd-b863-8471b011703c |
| 39 | [39-procedimento-editar.png](./39-procedimento-editar.png) | Procedimento — editar (Cliente não respondeu) | http://127.0.0.1:5173/sops/931a3eca-36bb-4bfd-b863-8471b011703c/editar |
| 40 | [40-portal-contratante.png](./40-portal-contratante.png) | Área do contratante (link público) | http://127.0.0.1:5173/s/a55be3a8ac2d4a0a8ccd45f547ec5583 |
