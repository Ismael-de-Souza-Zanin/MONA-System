using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

/// <summary>
/// Conta de e-mail do cliente direto (não cliente-de-cliente).
/// Em POC: IsDemo=true e leitura via EmailKit DemoMailbox.
/// Produção: tokens OAuth cifrados + Gmail/Outlook.
/// </summary>
public class ClientEmailAccount : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    /// <summary>gmail | outlook | smtp | demo</summary>
    public string Provider { get; set; } = "demo";
    public string EmailAddress { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsDemo { get; set; } = true;
    public bool IsActive { get; set; } = true;
    /// <summary>Refresh token cifrado (produção).</summary>
    public string? EncryptedRefreshToken { get; set; }
}

public class ScheduledEmail : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public Guid? ClientEmailAccountId { get; set; }
    public ClientEmailAccount? ClientEmailAccount { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string ToAddress { get; set; } = string.Empty;
    public string? ToName { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; }
    /// <summary>Quando enviar (UTC).</summary>
    public DateTime ScheduledAtUtc { get; set; }
    /// <summary>Fuso em que a assistente programou (para auditoria/exibição).</summary>
    public string ScheduledInTimeZoneId { get; set; } = "America/Sao_Paulo";
    public string Status { get; set; } = "Scheduled"; // Scheduled | Sent | Failed | Cancelled
    public string? ProviderKey { get; set; }
    public string? ProviderMessageId { get; set; }
    public string? Error { get; set; }
    public DateTime? SentAtUtc { get; set; }
}
