namespace EmailKit.Models;

public sealed record EmailAddress(string Address, string? DisplayName = null)
{
    public override string ToString() =>
        string.IsNullOrWhiteSpace(DisplayName) ? Address : $"{DisplayName} <{Address}>";
}

public sealed class EmailMessage
{
    public string? MessageId { get; set; }
    public EmailAddress From { get; set; } = new("noreply@localhost");
    public List<EmailAddress> To { get; set; } = [];
    public List<EmailAddress> Cc { get; set; } = [];
    public List<EmailAddress> Bcc { get; set; } = [];
    public string Subject { get; set; } = string.Empty;
    public string? TextBody { get; set; }
    public string? HtmlBody { get; set; }
    public DateTime? ScheduledAtUtc { get; set; }
    public IDictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();
    public IList<EmailAttachment> Attachments { get; set; } = [];
}

public sealed class EmailAttachment
{
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public required byte[] Content { get; set; }
}

public sealed class MailboxMessage
{
    public required string ExternalId { get; set; }
    public required string Subject { get; set; }
    public required EmailAddress From { get; set; }
    public List<EmailAddress> To { get; set; } = [];
    public string? Snippet { get; set; }
    public string? TextBody { get; set; }
    public string? HtmlBody { get; set; }
    public DateTime ReceivedAtUtc { get; set; }
    public bool IsRead { get; set; }
    public bool IsOutbound { get; set; }
    public string Folder { get; set; } = "INBOX";
}

public sealed class SendResult
{
    public bool Success { get; init; }
    public string? ProviderMessageId { get; init; }
    public string? Error { get; init; }
    public string ProviderKey { get; init; } = "";

    public static SendResult Ok(string providerKey, string? id = null) =>
        new() { Success = true, ProviderKey = providerKey, ProviderMessageId = id };

    public static SendResult Fail(string providerKey, string error) =>
        new() { Success = false, ProviderKey = providerKey, Error = error };
}

public enum EmailProviderKind
{
    DevFile = 0,
    Smtp = 1,
    Gmail = 2,
    Outlook = 3
}
