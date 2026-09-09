using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class PartnerCompany : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? ResponsibleName { get; set; }
    public string? Contact { get; set; }
    public string? Service { get; set; }
    public string? Observations { get; set; }
    public ICollection<ClientPartner> ClientLinks { get; set; } = new List<ClientPartner>();
}
