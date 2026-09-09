using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class ServiceItem : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    /// <summary>Categoria livre (ex.: Atendimento, Fiscal, Admin).</summary>
    public string Category { get; set; } = "Geral";
    /// <summary>Especificidades / checklists do serviço.</summary>
    public List<string> Specificities { get; set; } = [];
    /// <summary>Notas só para a equipe (não compartilhar com cliente).</summary>
    public string? AssistantNotes { get; set; }
    /// <summary>Texto que pode ir ao cliente / comunicação.</summary>
    public string? ClientFacingNotes { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<ClientService> ClientLinks { get; set; } = [];
}

/// <summary>Serviço contratado / ativo em um cliente (controle da assistente).</summary>
public class ClientService : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public Guid ServiceItemId { get; set; }
    public ServiceItem ServiceItem { get; set; } = null!;
    public string Status { get; set; } = "Active"; // Active | Paused | Ended
    public string? CustomNotes { get; set; }
    public string? AssignedAssistantUserId { get; set; }
}
