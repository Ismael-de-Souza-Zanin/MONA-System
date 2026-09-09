using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class AppCatalogItem : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? HomeUrl { get; set; }
    public string? DownloadUrl { get; set; }
}
