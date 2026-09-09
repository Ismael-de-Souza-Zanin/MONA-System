using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class ClientLink : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}
