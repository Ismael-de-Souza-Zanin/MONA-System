# Arquitetura de integrações reutilizáveis

Dois produtos portáteis nascem neste monorepo e devem servir **outros clientes** além da Fatto Virtual:

| Pacote | Pasta | Host atual | POC |
|--------|-------|------------|-----|
| **EmailKit** | `packages/EmailKit` | FattoVirtual | Caixa demo + envio programado (DevFile) |
| **WhatsAppKit** | `packages/WhatsAppKit` | FattoVirtual | Inbox demo + envio (DevFile) |

```
Host (FattoVirtual.Api / futuro outro SaaS)
  - Contas, OAuth, permissões, multi-tenant, UI
  - ScheduledEmail / Chat / AppNotification
           |
           +-- EmailKit (IEmailSender, IMailboxClient, DevFile/SMTP/Gmail/Outlook)
           +-- WhatsAppKit (IWhatsAppSender, IWhatsAppInbox, DevFile/Meta Cloud)
```

## Regras de design

1. **Kits não conhecem FattoVirtual** — zero referência a Domain/EF do host.
2. **Host decide persistência** — tokens, filas, auditoria ficam no app.
3. **POC sempre funcional** — `DevFile*` grava JSON em disco (demo para a Ju sem credenciais).
4. **Especificidades Fatto** ficam no host: só cliente direto, fuso da assistente, SOP, chat interno.

## Especificidades Fatto (host)

- E-mail / WhatsApp apenas para **clientes diretos** (não clientes-de-clientes).
- Agendamento em **UTC** + exibição no **fuso efetivo** (casa ou viagem).
- Alertas com ciclo **vista → resolvida (Early | OnTime | Late)**.
- Chat interno entre atendentes; WhatsApp da linha Fatto é canal externo.

## Próximos passos

### EmailKit
Ver `packages/EmailKit/NEXT_STEPS.md` — OAuth Gmail/Outlook, tokens cifrados, senders reais.

### WhatsAppKit
Ver `packages/WhatsAppKit/NEXT_STEPS.md` — Meta Cloud API, webhooks, templates 24h, número Fatto.

### Produto
1. Composer unificado (e-mail + WhatsApp) a partir do cliente.
2. Templates ligados a SOPs.
3. Bridge chat interno ↔ WhatsApp (opcional, com opt-in).
