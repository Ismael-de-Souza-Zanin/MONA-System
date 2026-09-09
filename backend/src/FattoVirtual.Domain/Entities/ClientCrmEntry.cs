using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

/// <summary>Registro de relacionamento — timeline do CRM do cliente.</summary>
public class ClientCrmEntry : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    /// <summary>Note | Call | WhatsApp | Email | Meeting | Other</summary>
    public string Kind { get; set; } = "Note";
    public string Summary { get; set; } = string.Empty;
    public string? Channel { get; set; }
    public DateTime? FollowUpAtUtc { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string? CreatedByName { get; set; }
}
