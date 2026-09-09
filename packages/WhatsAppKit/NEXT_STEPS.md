# WhatsAppKit — próximos passos (Ju)

## POC atual (Fatto pronto)
- `DevFileWhatsAppSender` grava envios em pasta configurável.
- Inbox demo com mensagens fictícias.
- Host Fatto:
  - `GET /api/v1/whatsapp/status` — prontidão / provider
  - `GET|POST /api/v1/whatsapp/webhook` — verify Meta + stub inbound
  - `GET /api/v1/whatsapp/inbox`, `POST /api/v1/whatsapp/send`

## Produção (Meta Cloud API) — com a Ju
1. Criar app no Meta for Developers + WhatsApp Business.
2. Configurar:
   - `WhatsAppKit:Meta:PhoneNumberId`
   - `WhatsAppKit:Meta:AccessToken`
   - `WhatsAppKit:Meta:VerifyToken`
3. Implementar HTTP em `MetaCloudWhatsAppSender`:
   - `POST /{phone-number-id}/messages` (texto / template).
   - Completar parse do webhook inbound (hoje o host só notifica genericamente).
4. Templates aprovados para fora da janela de 24h.
5. Rate limits e opt-out (LGPD).

## Reuso em outros projetos
```csharp
services.AddWhatsAppKit(o => o.OutputDirectory = "...");
var sender = factory.GetSender(WhatsAppProviderKind.MetaCloud);
```

## Fatto (regras de produto)
- Número oficial da operação.
- Vincular telefone ao cliente direto no send.
- Alertas/agenda/tarefas podem disparar WhatsApp depois que Meta estiver live.
- Nunca usar para clientes-de-clientes sem regra explícita.

Doc reunião: `docs/REUNIAO-JU-MENU-SERVICOS-CHAT-WHATSAPP.md`.
