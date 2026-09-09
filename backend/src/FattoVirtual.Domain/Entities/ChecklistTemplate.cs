using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class ChecklistTemplate : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public List<string> Items { get; set; } = [];
}
