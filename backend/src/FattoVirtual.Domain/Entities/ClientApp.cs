using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class ClientApp : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public Guid? AppId { get; set; }
    public AppCatalogItem? App { get; set; }
    public string Name { get; set; } = string.Empty;
}
