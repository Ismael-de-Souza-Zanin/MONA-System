using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class OnboardingItem : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public int SortOrder { get; set; }
}
