using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class SopStep : BaseEntity
{
    public Guid SopId { get; set; }
    public Sop Sop { get; set; } = null!;
    public int SortOrder { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Instruction { get; set; } = string.Empty;
    public bool IsCritical { get; set; }
    public int? EstimatedMinutes { get; set; }
    /// <summary>none | open_path | create_todo | create_agenda</summary>
    public string ActionKind { get; set; } = "none";
    /// <summary>Rota interna (ex.: /financeiro) quando ActionKind = open_path.</summary>
    public string? ActionPath { get; set; }
    public string? ActionLabel { get; set; }
}

/// <summary>Execução guiada de uma SOP por uma assistente.</summary>
public class SopRun : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid SopId { get; set; }
    public Sop Sop { get; set; } = null!;
    public string StartedByUserId { get; set; } = string.Empty;
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public Guid? ServiceItemId { get; set; }
    public ServiceItem? ServiceItem { get; set; }
    public Guid? AgendaEventId { get; set; }
    public AgendaEvent? AgendaEvent { get; set; }
    public Guid? TodoItemId { get; set; }
    public TodoItem? TodoItem { get; set; }
    public string Status { get; set; } = "InProgress"; // InProgress | Completed | Abandoned
    public DateTime? CompletedAtUtc { get; set; }
    public string? Notes { get; set; }
    /// <summary>Marcado se atrasou / passou do SLA ou assistente indicou atraso.</summary>
    public bool WasDelayed { get; set; }
    public string? DelayNotes { get; set; }
    public ICollection<SopRunStep> Steps { get; set; } = [];
}

public class SopRunStep : BaseEntity
{
    public Guid SopRunId { get; set; }
    public SopRun SopRun { get; set; } = null!;
    public Guid SopStepId { get; set; }
    public SopStep SopStep { get; set; } = null!;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}
