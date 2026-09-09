using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class ShareLink : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Token { get; set; } = Guid.NewGuid().ToString("N");
    public string Tab { get; set; } = string.Empty;
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    /// <summary>Permite mensagens do contratante (portal/client).</summary>
    public bool AllowMessages { get; set; } = true;
    /// <summary>Permite upload de fotos/docs pelo link.</summary>
    public bool AllowUploads { get; set; } = true;
    /// <summary>Expõe telefone/e-mail do cliente no portal.</summary>
    public bool ShareContactInfo { get; set; } = false;
}
