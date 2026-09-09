using System.Text;
using System.Text.Json;
using EmailKit.Abstractions;
using EmailKit.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EmailKit.Providers;

public sealed class DevFileEmailOptions
{
    /// <summary>Pasta onde .eml/.json são gravados (POC verificável sem SMTP).</summary>
    public string OutputDirectory { get; set; } = Path.Combine(Path.GetTempPath(), "EmailKit", "outbox");
}

/// <summary>
/// Sender de desenvolvimento: sempre “envia” gravando arquivo. Ideal para POC e testes.
/// Reutilizável em qualquer projeto sem credenciais externas.
/// </summary>
public sealed class DevFileEmailSender : IEmailSender
{
    private readonly DevFileEmailOptions _options;
    private readonly ILogger<DevFileEmailSender> _logger;

    public DevFileEmailSender(IOptions<DevFileEmailOptions> options, ILogger<DevFileEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public string ProviderKey => "dev-file";

    public async Task<SendResult> SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(_options.OutputDirectory);
        var id = message.MessageId ?? Guid.NewGuid().ToString("N");
        var stamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var path = Path.Combine(_options.OutputDirectory, $"{stamp}_{id}.json");

        var payload = new
        {
            id,
            sentAtUtc = DateTime.UtcNow,
            from = message.From.ToString(),
            to = message.To.Select(t => t.ToString()).ToArray(),
            cc = message.Cc.Select(t => t.ToString()).ToArray(),
            subject = message.Subject,
            textBody = message.TextBody,
            htmlBody = message.HtmlBody,
            scheduledAtUtc = message.ScheduledAtUtc
        };

        await File.WriteAllTextAsync(path, JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true }), Encoding.UTF8, cancellationToken);
        _logger.LogInformation("EmailKit DevFile sent → {Path} subject={Subject}", path, message.Subject);
        return SendResult.Ok(ProviderKey, id);
    }
}
