using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class ChatThread : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public bool IsDirect { get; set; } = true;
    /// <summary>Chat “comigo” (notas pessoais).</summary>
    public bool IsSelf { get; set; }
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public ICollection<ChatParticipant> Participants { get; set; } = [];
    public ICollection<ChatMessage> Messages { get; set; } = [];
}

public class ChatParticipant : BaseEntity
{
    public Guid ThreadId { get; set; }
    public ChatThread Thread { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    public DateTime? LastReadAtUtc { get; set; }
}

public class ChatMessage : BaseEntity
{
    public Guid ThreadId { get; set; }
    public ChatThread Thread { get; set; } = null!;
    public string AuthorUserId { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    /// <summary>internal | whatsapp-bridge (futuro)</summary>
    public string Channel { get; set; } = "internal";
    /// <summary>none | client | service | todo | agenda | payment | contract</summary>
    public string AttachmentKind { get; set; } = "none";
    public Guid? AttachmentId { get; set; }
    public string? AttachmentLabel { get; set; }
    /// <summary>Rota interna sugerida (ex.: /clientes/{id}).</summary>
    public string? AttachmentPath { get; set; }
}
