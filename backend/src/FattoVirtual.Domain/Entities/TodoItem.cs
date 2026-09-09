using FattoVirtual.Domain.Common;
using FattoVirtual.Domain.Enums;

namespace FattoVirtual.Domain.Entities;

public class TodoItem : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TodoStatus Status { get; set; } = TodoStatus.Todo;
    public Guid? BoardColumnId { get; set; }
    public TodoBoardColumn? BoardColumn { get; set; }
    public TodoScope Scope { get; set; } = TodoScope.Personal;
    public string? AssignedUserId { get; set; }
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    /// <summary>Prazo em UTC — exibido no fuso efetivo da assistente.</summary>
    public DateTime? DueAtUtc { get; set; }
    public string Priority { get; set; } = "Normal"; // Low | Normal | High | Urgent
    public List<string> Tags { get; set; } = [];
    public Guid? AgendaEventId { get; set; }
    public AgendaEvent? AgendaEvent { get; set; }
    public DateTime? OverdueNotifiedAtUtc { get; set; }
    public ICollection<TodoComment> Comments { get; set; } = [];
}
