# Reunião Ju — Menu, Serviços, Chat e WhatsApp

Documento para revisão da Ju antes da reunião (site + estes docs).  
Data de referência: 2026-08-10.

---

## 1. O que pedir para validar no site

Login seed: `ju@fattovirtual.com` / `Admin123!`  
Web: `http://localhost:5173` · API: `http://localhost:5080`

| Item | Onde clicar | O que esperar |
|------|-------------|---------------|
| Menu recolhido | Ícone painel (um só no desktop) | **Um** botão de expandir; no hover, nome da opção aparece à direita |
| Personalizar menu | Sidebar → Personalizar menu | Fusos e botões **dentro** da largura; sem overflow |
| Serviços | Menu → Serviços | Categoria, especificidades, notas equipe/cliente, vincular cliente |
| Chat página | Menu → Chat | Direto, **Chat consigo**, **grupo**, anexar tarefa/agenda/cliente/serviço |
| Chat flutuante | Bolha inferior direita | Direto + consigo + anexos (grupos na página completa) |
| WhatsApp status | API `GET /api/v1/whatsapp/status` | `readyForMeta: true`, webhook path documentado |

---

## 2. Sidebar / UX (feito)

- Removido o segundo ícone de abrir menu no desktop (só mobile usa toggle no topo do conteúdo).
- Menu colapsado: **tooltip elegante** no hover com o nome da opção (nav + rodapé).
- Painel “Personalizar menu”: `min-w-0` / selects com `max-w-full` para não estourar a sidebar.

---

## 3. Serviços por cliente (feito / backend + UI)

Cada serviço passa a ter:

- Categoria livre
- Especificidades (checklist)
- Notas só da equipe (`assistantNotes`)
- Texto comunicável ao cliente (`clientFacingNotes`)
- Vínculo **ClientService** (cliente ↔ serviço, status, notas custom, assistente)

APIs:

- `GET/POST/PUT /api/v1/services`
- `POST /api/v1/services/{id}/assign-client`
- `GET /api/v1/clients/{id}/services`

**Para a Ju validar:** dá para cadastrar especificidades reais da operação e amarrar no cliente certo sem inventar “vertical de mercado” fixa.

---

## 4. Chat: entidades, grupos, consigo (feito)

| Tipo | Como |
|------|------|
| Direto 1:1 | Selecionar colega → Iniciar |
| Consigo | Botão “Chat consigo” / “Consigo” (notas pessoais) |
| Grupo | Página Chat → checkboxes + Criar grupo |
| Anexos | Tarefa, agenda, cliente, serviço (payment/contract no backend) |

**ACL:** ao anexar, o servidor resolve o recurso e **recusa (403)** se a pessoa não tiver permissão/escopo. Só quem tem acesso compartilha o link interno.

Integração agenda/tarefas: anexar no chat (grupo ou pessoal) com link “Abrir” para a tela certa.

Canal futuro: `ChatMessage.Channel` já prevê `whatsapp-bridge`.

---

## 5. WhatsApp — lado Fatto pronto; Meta com a Ju

Decisão: **a Ju faz a integração Meta**; o host Fatto já deixa o encaixe.

### Já disponível

| Endpoint | Função |
|----------|--------|
| `GET /api/v1/whatsapp/status` | Credenciais Meta? provider ativo? capabilities |
| `GET /api/v1/whatsapp/webhook` | Verify token Meta (`hub.challenge`) |
| `POST /api/v1/whatsapp/webhook` | Stub inbound → notificação interna |
| `GET /api/v1/whatsapp/inbox` | Inbox POC (DevFile) |
| `POST /api/v1/whatsapp/send` | Envio + vínculo opcional `clientId` + alerta |

Pacote: `packages/WhatsAppKit/` (`DevFile` hoje; `MetaCloud` quando a Ju colar tokens).

Config esperada (quando Meta estiver pronta):

```
WhatsAppKit:Meta:AccessToken
WhatsAppKit:Meta:PhoneNumberId
WhatsAppKit:Meta:VerifyToken
```

Detalhes técnicos: `packages/WhatsAppKit/NEXT_STEPS.md` e `docs/modulos/06-whatsapp.md`.

### O que a Ju precisa trazer / fazer depois

1. App Meta + WhatsApp Business + número da operação  
2. Templates aprovados  
3. Completar parse inbound no webhook (hoje stub genérico)  
4. Definir: número único vs por atendente; alertas agenda/tarefa → WhatsApp  

---

## 6. Perguntas abertas para a reunião

1. Preferência de nomes no menu colapsado: só hover ou também pin de favoritos?  
2. Serviços: quer tela dentro do detalhe do cliente além do catálogo global?  
3. Chat: anexar pagamento/contrato na UI (API já aceita)?  
4. WhatsApp: alertas automáticos (agenda overdue / tarefa) devem oferecer “avisar no WhatsApp”?  
5. Clientes-de-clientes: WhatsApp só na linha Fatto (regra atual) — confirmar.

---

## 7. Docs relacionados

- `docs/BRIEFING-ALINHAMENTO-JU.md` — visão Access Graph / áudio  
- `docs/MAPA-TELAS.md` — inventário de telas  
- `docs/modulos/07-chat.md`, `06-whatsapp.md`, `00-briefing-ju.md`  
- Este arquivo — checklist da reunião focada nestes entregáveis  
