using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

/// <summary>
/// Agrupamento definido pela organização/assistentes — não é catálogo de negócio do produto.
/// Exemplos: "Atendimento rápido", "EUA", "Documentos" — cada org cria os seus.
/// </summary>
public class ClientGroup : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Color { get; set; } = "#006D69";
    public int SortOrder { get; set; }
    public ICollection<Client> Clients { get; set; } = [];
}
