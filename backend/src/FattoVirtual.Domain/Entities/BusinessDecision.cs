using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

/// <summary>O que ficou combinado numa reunião — dono, prazo, visível no portal.</summary>
public class BusinessDecision : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public Guid? AgendaEventId { get; set; }
    public AgendaEvent? AgendaEvent { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public string? OwnerUserId { get; set; }
    public string? OwnerName { get; set; }
    public DateTime? DueAtUtc { get; set; }
    public bool VisibleToClient { get; set; }
    public bool IsOpen { get; set; } = true;
    public Guid? TodoItemId { get; set; }
    public TodoItem? TodoItem { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
}
