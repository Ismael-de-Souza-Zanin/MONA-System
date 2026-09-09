using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class ClientTopic : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Observation { get; set; } = string.Empty;
}
