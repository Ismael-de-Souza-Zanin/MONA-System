using FattoVirtual.Domain.Common;
using FattoVirtual.Domain.Enums;

namespace FattoVirtual.Domain.Entities;

public class Client : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CompanyName { get; set; }
    public string? Email { get; set; }
    public ClientStatus Status { get; set; } = ClientStatus.Active;
    public string? CrmNotes { get; set; }
    public string? Segment { get; set; }
    /// <summary>Grupo criado pela assistente/org (organização flexível).</summary>
    public Guid? ClientGroupId { get; set; }
    public ClientGroup? ClientGroup { get; set; }
    /// <summary>Tags livres definidas pela assistente (ex.: "urgente", "doc", "en").</summary>
    public List<string> Tags { get; set; } = [];
    /// <summary>Idioma preferido do contato (livre: pt-BR, es, en…).</summary>
    public string PreferredLanguage { get; set; } = "pt-BR";
    /// <summary>País/mercado livre (US, BR…).</summary>
    public string? MarketCountry { get; set; }
    /// <summary>Legado — preferir ClientGroup. Mantido só para migração.</summary>
    public string? ServiceVertical { get; set; }
    /// <summary>Legado — preferir Tags.</summary>
    public List<string> ServiceScopes { get; set; } = [];
    public string? Document { get; set; }
    public string? Address { get; set; }
    public string? FinanceNotes { get; set; }
    public string? ContractNotes { get; set; }
    public string? ServiceWorkNotes { get; set; }
    public string? AdditionalNotes { get; set; }
    public DateOnly? ContractRenewalDate { get; set; }
    public string? ContractCode { get; set; }
    /// <summary>IANA do cliente (para agenda/comunicação no fuso dele).</summary>
    public string TimeZoneId { get; set; } = "America/Sao_Paulo";
    public bool OnboardingCompleted { get; set; }
    /// <summary>Precisa resposta rápida (fila operação).</summary>
    public bool NeedsQuickResponse { get; set; }
    /// <summary>Horas do pacote/retainer no mês (0 = sem pacote).</summary>
    public decimal RetainerHoursPerMonth { get; set; }

    /// <summary>Estágio de relacionamento: Novo | Ativo | EmRisco | Vip | Pausado</summary>
    public string RelationshipStage { get; set; } = "Ativo";
    public string? NextAction { get; set; }
    public DateTime? NextActionAtUtc { get; set; }
    public DateTime? LastContactAtUtc { get; set; }

    public ICollection<ClientTopic> Topics { get; set; } = [];
    public ICollection<ClientLink> Links { get; set; } = [];
    public ICollection<ClientCredential> Credentials { get; set; } = [];
    public ICollection<ClientApp> ClientApps { get; set; } = [];
    public ICollection<OnboardingItem> OnboardingItems { get; set; } = [];
    public ICollection<Invoice> Invoices { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
    public ICollection<EmployeeClient> EmployeeLinks { get; set; } = [];
    public ICollection<ClientCrmEntry> CrmEntries { get; set; } = [];
    public ICollection<ClientDocument> Documents { get; set; } = [];
    public ICollection<ClientPortalMessage> PortalMessages { get; set; } = [];
}
