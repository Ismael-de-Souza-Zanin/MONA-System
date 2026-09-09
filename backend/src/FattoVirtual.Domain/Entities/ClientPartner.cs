using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

/// <summary>
/// Vínculo de uma parceira do catálogo da org com um cliente específico.
/// O catálogo PartnerCompany continua sendo da empresa (Fatto/admin);
/// este join marca quais parceiros atendem cada cliente.
/// </summary>
public class ClientPartner : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public Guid PartnerCompanyId { get; set; }
    public PartnerCompany PartnerCompany { get; set; } = null!;
    public string Status { get; set; } = "Active";
    public string? Notes { get; set; }
}
