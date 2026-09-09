# EmailKit — próximos passos (Gmail / Outlook / produção)

Pacote portátil em `packages/EmailKit`. A FattoVirtual é o primeiro host; o mesmo projeto pode ser referenciado por outros sistemas.

## O que já existe (POC)

| Peça | Status |
|------|--------|
| `IEmailSender` / `IMailboxClient` / `IEmailProviderFactory` | Pronto |
| `DevFileEmailSender` | Funcional — grava JSON na outbox |
| `SmtpEmailSender` | Pronto para configurar |
| `GmailApiEmailSender` / `OutlookGraphEmailSender` | Stubs tipados |
| `DemoMailboxClient` | Caixa fake para UI |
| Worker `ScheduledEmailBackgroundService` (host) | Envio programado funcional via DevFile |
| UI `/emails` | POC de leitura + programação |

## Próximos passos recomendados

### 1. OAuth app registrations
1. **Google Cloud Console** — projeto OAuth, escopos `gmail.readonly`, `gmail.send` (ou `gmail.modify`).
2. **Microsoft Entra ID** — app registration, Microsoft Graph: `Mail.Read`, `Mail.Send`, `offline_access`.
3. Guardar `ClientId` / `ClientSecret` / `Tenant` só em secrets (nunca no repo).

### 2. Fluxo de conexão por cliente direto
1. Endpoint `GET /emails/oauth/{provider}/start?clientId=` → redirect consent.
2. Callback guarda **refresh token cifrado** em `ClientEmailAccount.EncryptedRefreshToken`.
3. Marcar `IsDemo=false`, `Provider=gmail|outlook`.
4. Política: somente **clientes diretos** da organização (já validado no controller).

### 3. Implementar senders reais
1. Em `GmailApiEmailSender.SendAsync`: refresh token → access token → `users.messages.send` (raw MIME base64url).
2. Em `OutlookGraphEmailSender.SendAsync`: Graph `POST /me/sendMail` (ou `/users/{id}/sendMail` com app-only).
3. `ListAsync` / `GetAsync`: mapear para `MailboxMessage` do EmailKit (sem DTOs do host).

### 4. Produção do scheduler
1. Trocar default `ProviderKey` de `dev-file` para `gmail`/`outlook` por conta.
2. Retries com backoff + dead-letter (`Status=Failed` já existe).
3. Idempotência por `ProviderMessageId`.
4. Outbox métricas (OpenTelemetry).

### 5. Reuso em outros projetos
```csharp
services.AddEmailKit(o => o.OutputDirectory = "...");
// ou
services.Configure<SmtpEmailOptions>(config.GetSection("EmailKit:Smtp"));
var sender = factory.GetSender(EmailProviderKind.Gmail);
```
- Não referenciar `FattoVirtual.*` dentro do EmailKit.
- Persistência de contas/agendamentos fica no host (como aqui).

### 6. Segurança
1. Cifrar tokens com o `ISecretProtector` já existente.
2. Auditoria: quem programou, para qual cliente, quando (UTC + TZ).
3. Rate limit por organização.
4. Bloquear envio se destinatário não for e-mail do cliente direto / whitelist.

### 7. UX
1. Composer rich-text + templates por SOP.
2. Thread view (conversationId Gmail/Graph).
3. “Enviar às 09:00 no fuso do cliente” (já temos conversão IANA).
