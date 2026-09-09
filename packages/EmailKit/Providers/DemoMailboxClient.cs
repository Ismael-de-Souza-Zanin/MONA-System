using EmailKit.Abstractions;
using EmailKit.Models;

namespace EmailKit.Providers;

/// <summary>
/// Caixa demo determinística — permite POC de UI sem OAuth.
/// A aplicação host pode preferir dados próprios; este client serve como fallback portátil.
/// </summary>
public sealed class DemoMailboxClient : IMailboxClient
{
    public string ProviderKey => "demo";

    public Task<IReadOnlyList<MailboxMessage>> ListAsync(MailboxQuery query, CancellationToken cancellationToken = default)
    {
        var email = string.IsNullOrWhiteSpace(query.AccountEmail) ? "cliente@example.com" : query.AccountEmail;
        var now = DateTime.UtcNow;
        IReadOnlyList<MailboxMessage> items =
        [
            new MailboxMessage
            {
                ExternalId = "demo-1",
                Subject = "Reunião de alinhamento — confirmação",
                From = new EmailAddress(email, "Cliente"),
                To = [new EmailAddress("assistente@fattovirtual.com", "Assistente")],
                Snippet = "Confirmando o horário da call de amanhã...",
                TextBody = "Olá! Confirmando o horário da call de amanhã no fuso de vocês.",
                ReceivedAtUtc = now.AddHours(-5),
                IsRead = false,
                Folder = "INBOX"
            },
            new MailboxMessage
            {
                ExternalId = "demo-2",
                Subject = "Invoice #1042",
                From = new EmailAddress("billing@partner.com", "Billing"),
                To = [new EmailAddress(email)],
                Snippet = "Segue a fatura referente ao período...",
                TextBody = "Segue a fatura referente ao período. Qualquer dúvida, responda este e-mail.",
                ReceivedAtUtc = now.AddDays(-1),
                IsRead = true,
                Folder = "INBOX"
            },
            new MailboxMessage
            {
                ExternalId = "demo-out-1",
                Subject = "Follow-up: documentos pendentes",
                From = new EmailAddress("assistente@fattovirtual.com", "Assistente"),
                To = [new EmailAddress(email, "Cliente")],
                Snippet = "Passando para lembrar dos documentos...",
                TextBody = "Passando para lembrar dos documentos pendentes. Quando puder, envie o contrato assinado.",
                ReceivedAtUtc = now.AddHours(-30),
                IsRead = true,
                IsOutbound = true,
                Folder = "SENT"
            }
        ];

        var folder = query.Folder.Equals("SENT", StringComparison.OrdinalIgnoreCase) ? "SENT" : "INBOX";
        var filtered = items.Where(m => m.Folder.Equals(folder, StringComparison.OrdinalIgnoreCase))
            .Take(query.Take)
            .ToList();
        return Task.FromResult<IReadOnlyList<MailboxMessage>>(filtered);
    }

    public async Task<MailboxMessage?> GetAsync(string externalId, CancellationToken cancellationToken = default)
    {
        var all = await ListAsync(new MailboxQuery { Folder = "INBOX", Take = 100 }, cancellationToken);
        var sent = await ListAsync(new MailboxQuery { Folder = "SENT", Take = 100 }, cancellationToken);
        return all.Concat(sent).FirstOrDefault(m => m.ExternalId == externalId);
    }
}
