using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

/// <summary>Tempo da VA no cliente — explica retainer (plano B), não mistura com livro A.</summary>
public class TimeEntry : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public int Minutes { get; set; }
    public DateTime StartedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAtUtc { get; set; }
    public string? Note { get; set; }
    public bool Billable { get; set; } = true;
    public Guid? TodoItemId { get; set; }
    public Guid? AgendaEventId { get; set; }
}
