using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class AgendaEvent : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    /// <summary>Início em UTC (fonte da verdade).</summary>
    public DateTime StartsAt { get; set; }
    /// <summary>Fim em UTC (fonte da verdade).</summary>
    public DateTime EndsAt { get; set; }
    /// <summary>IANA do contexto do evento (cliente ou local da reunião).</summary>
    public string TimeZoneId { get; set; } = "America/Sao_Paulo";
    /// <summary>Minutos antes do início para notificar a assistente.</summary>
    public int RemindMinutesBefore { get; set; } = 30;
    public bool ReminderCreated { get; set; }
    public Guid? CategoryId { get; set; }
    public AgendaCategory? Category { get; set; }
    public Guid? ResponsibleEmployeeId { get; set; }
    public Employee? ResponsibleEmployee { get; set; }
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public string? OwnerUserId { get; set; }
    public ICollection<TodoItem> LinkedTodos { get; set; } = [];
}
