using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class FaqItem : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    /// <summary>Grupo opcional para organização (ex.: Portal, Financeiro, Onboarding).</summary>
    public string? Category { get; set; }
    public bool IsPublished { get; set; } = true;
}
