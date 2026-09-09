using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class AccessType : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = [];
    public bool IsOwnerType { get; set; }
}
