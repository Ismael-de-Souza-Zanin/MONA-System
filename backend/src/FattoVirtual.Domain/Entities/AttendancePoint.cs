using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

/// <summary>Como aquele cliente é atendido neste serviço — canal, SLA, intake, escalonamento.</summary>
public class AttendancePoint : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public Guid? ServiceItemId { get; set; }
    public ServiceItem? ServiceItem { get; set; }
    public Guid? SopId { get; set; }
    public Sop? Sop { get; set; }
    public string Name { get; set; } = string.Empty;
    /// <summary>WhatsApp | Email | Phone | Portal | Other</summary>
    public string Channel { get; set; } = "WhatsApp";
    public string? WindowNote { get; set; }
    public int? SlaMinutes { get; set; }
    public string? IntakeNotes { get; set; }
    public string? EscalationNotes { get; set; }
    public bool IsActive { get; set; } = true;
}
