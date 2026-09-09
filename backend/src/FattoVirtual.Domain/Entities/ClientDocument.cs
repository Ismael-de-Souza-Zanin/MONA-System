using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

/// <summary>Documento/comprovante do cliente — staff ou contratante (via link).</summary>
public class ClientDocument : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public Guid? ShareLinkId { get; set; }
    public ShareLink? ShareLink { get; set; }
    public string Title { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string StoredName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long SizeBytes { get; set; }
    /// <summary>Proof | Document | Photo | Other</summary>
    public string Kind { get; set; } = "Document";
    /// <summary>Staff | Contractor</summary>
    public string UploadedBy { get; set; } = "Staff";
    public string? UploaderLabel { get; set; }
    public string? UploadedByUserId { get; set; }
}

/// <summary>Mensagem no canal do portal (contratante ↔ equipe).</summary>
public class ClientPortalMessage : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public Guid? ShareLinkId { get; set; }
    public ShareLink? ShareLink { get; set; }
    public string Body { get; set; } = string.Empty;
    public bool FromContractor { get; set; }
    public string AuthorLabel { get; set; } = string.Empty;
    public string? AuthorUserId { get; set; }
    public bool IsReadByStaff { get; set; }
}
