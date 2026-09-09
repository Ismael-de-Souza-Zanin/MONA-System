using EmailKit.Models;

namespace EmailKit.Abstractions;

/// <summary>
/// Envio imediato. Implementações: DevFile (POC), SMTP, Gmail API, Microsoft Graph.
/// </summary>
public interface IEmailSender
{
    string ProviderKey { get; }
    Task<SendResult> SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
}

/// <summary>
/// Leitura de caixa (INBOX/SENT). Em POC pode retornar dados demo; produção usa OAuth + API.
/// </summary>
public interface IMailboxClient
{
    string ProviderKey { get; }
    Task<IReadOnlyList<MailboxMessage>> ListAsync(
        MailboxQuery query,
        CancellationToken cancellationToken = default);

    Task<MailboxMessage?> GetAsync(string externalId, CancellationToken cancellationToken = default);
}

public sealed class MailboxQuery
{
    public string AccountEmail { get; set; } = string.Empty;
    public string Folder { get; set; } = "INBOX";
    public int Take { get; set; } = 50;
    /// <summary>Token OAuth — vazio em modo demo.</summary>
    public string? AccessToken { get; set; }
}

/// <summary>
/// Resolve o sender/mailbox por provedor — permite múltiplos em um mesmo host.
/// </summary>
public interface IEmailProviderFactory
{
    IEmailSender GetSender(EmailProviderKind kind);
    IMailboxClient GetMailbox(EmailProviderKind kind);
}
