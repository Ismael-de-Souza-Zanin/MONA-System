using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class EmployeeClient : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
}
