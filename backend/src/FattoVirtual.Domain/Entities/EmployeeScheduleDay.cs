using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class EmployeeScheduleDay : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public DateOnly Date { get; set; }
    public bool IsWorkDay { get; set; } = true;
    public string? Note { get; set; }
}
