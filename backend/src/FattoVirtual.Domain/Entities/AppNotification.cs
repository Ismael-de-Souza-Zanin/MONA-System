using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class AppNotification : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Link { get; set; }
    public string Type { get; set; } = "agenda";
    public DateTime OccursAtUtc { get; set; }
    /// <summary>Marcada como visualizada.</summary>
    public bool IsRead { get; set; }
    public DateTime? ViewedAtUtc { get; set; }
    /// <summary>null | Early | OnTime | Late</summary>
    public string? ResolutionStatus { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }
    public string? ResolvedByUserId { get; set; }
    public string? ResolutionNote { get; set; }
    public Guid? RelatedAgendaEventId { get; set; }
    public AgendaEvent? RelatedAgendaEvent { get; set; }
    public Guid? RelatedTodoItemId { get; set; }
    public TodoItem? RelatedTodoItem { get; set; }
    public string Priority { get; set; } = "Normal"; // Low | Normal | High | Urgent
}
