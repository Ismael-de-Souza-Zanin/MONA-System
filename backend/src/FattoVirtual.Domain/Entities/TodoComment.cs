using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class TodoComment : BaseEntity
{
    public Guid TodoItemId { get; set; }
    public TodoItem TodoItem { get; set; } = null!;
    public string AuthorUserId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool NotifyOwner { get; set; }
}
