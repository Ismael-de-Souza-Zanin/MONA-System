using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

/// <summary>Coluna editável do quadro de tarefas (por organização).</summary>
public class TodoBoardColumn : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#006D69";
    public int SortOrder { get; set; }
    /// <summary>Ao mover card para esta coluna, marca tarefa como concluída.</summary>
    public bool MarksComplete { get; set; }
    public ICollection<TodoItem> Todos { get; set; } = [];
}
