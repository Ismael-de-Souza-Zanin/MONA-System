using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WhatsAppKit.Abstractions;
using WhatsAppKit.Models;

namespace WhatsAppKit.Providers;

public sealed class DevFileWhatsAppOptions
{
    public string OutputDirectory { get; set; } = Path.Combine(Path.GetTempPath(), "WhatsAppKit", "outbox");
}

/// <summary>POC verificável sem Meta — grava JSON na outbox.</summary>
public sealed class DevFileWhatsAppSender : IWhatsAppSender, IWhatsAppInbox
{
    private readonly DevFileWhatsAppOptions _options;
    private readonly ILogger<DevFileWhatsAppSender> _logger;

    public DevFileWhatsAppSender(IOptions<DevFileWhatsAppOptions> options, ILogger<DevFileWhatsAppSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public string ProviderKey => "dev-file";

    public async Task<WhatsAppSendResult> SendTextAsync(WhatsAppTextMessage message, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(_options.OutputDirectory);
        var id = Guid.NewGuid().ToString("N");
        var path = Path.Combine(_options.OutputDirectory, $"{DateTime.UtcNow:yyyyMMddHHmmss}_{id}.json");
        var payload = new
        {
            id,
            sentAtUtc = DateTime.UtcNow,
            to = message.ToE164,
            body = message.Body,
            from = message.FromDisplayName,
            template = message.TemplateName,
            metadata = message.Metadata
        };
        await File.WriteAllTextAsync(path, JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true }), Encoding.UTF8, cancellationToken);
        _logger.LogInformation("WhatsAppKit DevFile → {Path} to={To}", path, message.ToE164);
        return WhatsAppSendResult.Ok(ProviderKey, id);
    }

    public Task<IReadOnlyList<WhatsAppInboundMessage>> ListRecentAsync(WhatsAppInboxQuery query, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        IReadOnlyList<WhatsAppInboundMessage> demo =
        [
            new()
            {
                ExternalId = "wa-demo-1",
                FromE164 = "+5511999990001",
                ContactName = "Cliente Demo SP",
                Body = "Oi! Pode confirmar o horário da call de amanhã?",
                ReceivedAtUtc = now.AddMinutes(-40)
            },
            new()
            {
                ExternalId = "wa-demo-2",
                FromE164 = "+12125550100",
                ContactName = "Client NY",
                Body = "Please send the invoice PDF when ready.",
                ReceivedAtUtc = now.AddHours(-3)
            }
        ];
        return Task.FromResult<IReadOnlyList<WhatsAppInboundMessage>>(demo.Take(query.Take).ToList());
    }
}

public sealed class MetaCloudWhatsAppOptions
{
    public string? AccessToken { get; set; }
    public string? PhoneNumberId { get; set; }
    public string ApiVersion { get; set; } = "v21.0";
}

/// <summary>Stub Meta Cloud API — wire HTTP quando houver credenciais.</summary>
public sealed class MetaCloudWhatsAppSender : IWhatsAppSender, IWhatsAppInbox
{
    private readonly ILogger<MetaCloudWhatsAppSender> _logger;
    public MetaCloudWhatsAppSender(ILogger<MetaCloudWhatsAppSender> logger) => _logger = logger;
    public string ProviderKey => "meta-cloud";

    public Task<WhatsAppSendResult> SendTextAsync(WhatsAppTextMessage message, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Meta Cloud WhatsApp not configured. See packages/WhatsAppKit/NEXT_STEPS.md");
        return Task.FromResult(WhatsAppSendResult.Fail(ProviderKey, "Meta Cloud API not configured."));
    }

    public Task<IReadOnlyList<WhatsAppInboundMessage>> ListRecentAsync(WhatsAppInboxQuery query, CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<WhatsAppInboundMessage>>([]);
}
