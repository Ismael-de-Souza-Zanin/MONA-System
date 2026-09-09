using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

/// <summary>
/// Procedimento estruturado (não só documento). Camada base; overlays cobrem empresa/cliente sem duplicar.
/// </summary>
public class Sop : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string UsageDescription { get; set; } = string.Empty;
    public string Procedure { get; set; } = string.Empty;
    public string Rules { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    /// <summary>Área de exploração (Atendimento, Financeiro, Clientes…).</summary>
    public string Category { get; set; } = "Geral";
    /// <summary>Tipo tipado livre (Cobrança, Onboarding, Cancelamento…).</summary>
    public string ProcedureType { get; set; } = "Geral";
    /// <summary>Aplicável a (equipe / área responsável).</summary>
    public string ApplicableArea { get; set; } = "Operações";
    /// <summary>Gatilho em linguagem natural.</summary>
    public string TriggerDescription { get; set; } = string.Empty;
    public string? DefaultResponsible { get; set; }
    public int? SlaBusinessDays { get; set; }
    /// <summary>Frases que a assistente digita (“cliente não pagou”).</summary>
    public List<string> SituationAliases { get; set; } = [];
    /// <summary>Blob denormalizado para busca SQL.</summary>
    public string SituationSearch { get; set; } = string.Empty;
    public bool IsTemplate { get; set; }
    /// <summary>Opcional: pack futuro (universal | ramo:*) — não engessa vertical no core.</summary>
    public string? PackKey { get; set; }
    public Guid? ServiceItemId { get; set; }
    public ServiceItem? ServiceItem { get; set; }
    public int Version { get; set; } = 1;
    public int? EstimatedMinutes { get; set; }
    public string? OwnerUserId { get; set; }
    public DateTime? LastReviewedAtUtc { get; set; }
    public string? Outcome { get; set; }
    public ICollection<SopScript> Scripts { get; set; } = [];
    public ICollection<SopStep> Steps { get; set; } = [];
    public ICollection<SopRun> Runs { get; set; } = [];
    public ICollection<SopOverlay> Overlays { get; set; } = [];
}

/// <summary>Regra/exceção/condição da empresa ou cliente — sem clonar a SOP.</summary>
public class SopOverlay : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid SopId { get; set; }
    public Sop Sop { get; set; } = null!;
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public Guid? ServiceItemId { get; set; }
    public ServiceItem? ServiceItem { get; set; }
    /// <summary>Rule | Condition | Exception | Channel</summary>
    public string Kind { get; set; } = "Rule";
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
