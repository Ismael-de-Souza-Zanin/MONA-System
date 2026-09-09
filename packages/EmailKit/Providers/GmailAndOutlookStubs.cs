using EmailKit.Abstractions;
using EmailKit.Models;
using Microsoft.Extensions.Logging;

namespace EmailKit.Providers;

/// <summary>
/// Stub Gmail API — pronto para OAuth + Gmail REST. Não envia até configurar credenciais.
/// </summary>
public sealed class GmailApiEmailSender : IEmailSender, IMailboxClient
{
    private readonly ILogger<GmailApiEmailSender> _logger;
    public GmailApiEmailSender(ILogger<GmailApiEmailSender> logger) => _logger = logger;
    public string ProviderKey => "gmail";

    public Task<SendResult> SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Gmail sender not configured — use DevFile/SMTP for POC or wire OAuth.");
        return Task.FromResult(SendResult.Fail(ProviderKey, "Gmail OAuth not configured. See packages/EmailKit/NEXT_STEPS.md"));
    }

    public Task<IReadOnlyList<MailboxMessage>> ListAsync(MailboxQuery query, CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<MailboxMessage>>([]);

    public Task<MailboxMessage?> GetAsync(string externalId, CancellationToken cancellationToken = default) =>
        Task.FromResult<MailboxMessage?>(null);
}

/// <summary>
/// Stub Microsoft Graph / Outlook — pronto para OAuth + Graph mail endpoints.
/// </summary>
public sealed class OutlookGraphEmailSender : IEmailSender, IMailboxClient
{
    private readonly ILogger<OutlookGraphEmailSender> _logger;
    public OutlookGraphEmailSender(ILogger<OutlookGraphEmailSender> logger) => _logger = logger;
    public string ProviderKey => "outlook";

    public Task<SendResult> SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Outlook sender not configured — use DevFile/SMTP for POC or wire Graph OAuth.");
        return Task.FromResult(SendResult.Fail(ProviderKey, "Outlook Graph OAuth not configured. See packages/EmailKit/NEXT_STEPS.md"));
    }

    public Task<IReadOnlyList<MailboxMessage>> ListAsync(MailboxQuery query, CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<MailboxMessage>>([]);

    public Task<MailboxMessage?> GetAsync(string externalId, CancellationToken cancellationToken = default) =>
        Task.FromResult<MailboxMessage?>(null);
}
