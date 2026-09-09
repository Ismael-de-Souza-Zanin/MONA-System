using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class AgendaCategory : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#2563eb";
}
