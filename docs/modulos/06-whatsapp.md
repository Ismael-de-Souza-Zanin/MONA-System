# WhatsApp

## Papéis
- **Fatto (host):** endpoints, vínculo cliente, alertas, webhook stub, status de prontidão.
- **Ju:** app Meta Cloud, tokens, templates, parse inbound completo no WhatsAppKit.

## O que é hoje
| Endpoint | Uso |
|----------|-----|
| `GET /whatsapp/status` | `readyForMeta`, provider ativo, capabilities |
| `GET /whatsapp/webhook` | Verificação Meta (`hub.verify_token` / challenge) |
| `POST /whatsapp/webhook` | Stub inbound → notificação owner |
| `GET /whatsapp/inbox` | Inbox POC (DevFile) |
| `POST /whatsapp/send` | Envio + `clientId` opcional + alerta |

Provider ativo: **DevFile** até haver `WhatsAppKit:Meta:*` configurado.

## Escopo de negócio
- Linha oficial da operação / clientes diretos.
- Não usar para clientes-de-clientes sem regra explícita.

## Checklist Ju (Meta)
1. App + WhatsApp Business + Phone Number ID  
2. Access token + verify token no config  
3. Implementar HTTP em `MetaCloudWhatsAppSender`  
4. Parse webhook → mensagem + notificar assistente  
5. Templates 24h / LGPD opt-out  

Detalhe técnico: `packages/WhatsAppKit/NEXT_STEPS.md`.  
Reunião: `docs/REUNIAO-JU-MENU-SERVICOS-CHAT-WHATSAPP.md`.
