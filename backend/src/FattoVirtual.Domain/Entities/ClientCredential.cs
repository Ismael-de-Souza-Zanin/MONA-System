using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class ClientCredential : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public string AppName { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string EncryptedPassword { get; set; } = string.Empty;
}
