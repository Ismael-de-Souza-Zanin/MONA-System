using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class SopScript : BaseEntity
{
    public Guid SopId { get; set; }
    public Sop Sop { get; set; } = null!;
    public string ScriptType { get; set; } = "Default";
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
