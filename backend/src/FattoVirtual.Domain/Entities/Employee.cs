using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class Employee : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Color { get; set; }
    public Guid? ManagerId { get; set; }
    public Employee? Manager { get; set; }
    public ICollection<Employee> Reports { get; set; } = [];
    public string Status { get; set; } = "Active";
    public string? UserId { get; set; }

    public ICollection<EmployeeClient> ClientLinks { get; set; } = [];
    public ICollection<EmployeeScheduleDay> ScheduleDays { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
}
