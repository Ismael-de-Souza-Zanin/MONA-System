# Chat interno

## O que é hoje
- Threads **diretas**, **grupos** e **chat consigo** (notas pessoais).
- Widget flutuante + página `/chat`.
- Anexos de entidade: tarefa, agenda, cliente, serviço (e no backend também payment/contract).
- ACL: só compartilha recurso se o autor tiver permissão/escopo; senão 403.
- Notificação interna aos participantes ao receber mensagem.
- Campo `Channel` preparado para bridge WhatsApp (`internal` | futuro `whatsapp-bridge`).

## APIs
- `GET /chat/threads`, `POST /chat/threads` (`peerUserId` | `self` | `isGroup` + `participantUserIds`)
- `GET/POST /chat/threads/{id}/messages` (`body`, `attachmentKind`, `attachmentId`)
- `GET /chat/peers`

## Para a Ju
1. Grupos por cliente (vincular `clientId` no thread) — já há campo; UI de vínculo na criação de grupo pode evoluir.
2. Anexar pagamento/contrato na UI?
3. Histórico auditável / retenção?
4. Integração WhatsApp: mensagens de cliente entram no mesmo fio ou canal separado?

Ver também: `docs/REUNIAO-JU-MENU-SERVICOS-CHAT-WHATSAPP.md`.
