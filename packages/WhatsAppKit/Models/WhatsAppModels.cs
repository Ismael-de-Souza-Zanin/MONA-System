namespace WhatsAppKit.Models;

public enum WhatsAppProviderKind
{
    DevFile = 0,
    MetaCloud = 1
}

public sealed class WhatsAppTextMessage
{
    public required string ToE164 { get; set; }
    public required string Body { get; set; }
    public string? FromDisplayName { get; set; }
    /// <summary>Template name — produção Meta exige template fora da janela 24h.</summary>
    public string? TemplateName { get; set; }
    public IDictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
}

public sealed class WhatsAppInboundMessage
{
    public required string ExternalId { get; set; }
    public required string FromE164 { get; set; }
    public required string Body { get; set; }
    public DateTime ReceivedAtUtc { get; set; }
    public string? ContactName { get; set; }
}

public sealed class WhatsAppInboxQuery
{
    public string? PhoneNumberId { get; set; }
    public int Take { get; set; } = 30;
}

public sealed class WhatsAppSendResult
{
    public bool Success { get; init; }
    public string ProviderKey { get; init; } = "";
    public string? ProviderMessageId { get; init; }
    public string? Error { get; init; }

    public static WhatsAppSendResult Ok(string provider, string? id = null) =>
        new() { Success = true, ProviderKey = provider, ProviderMessageId = id };

    public static WhatsAppSendResult Fail(string provider, string error) =>
        new() { Success = false, ProviderKey = provider, Error = error };
}
