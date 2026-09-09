using FattoVirtual.Domain.Common;
using FattoVirtual.Domain.Enums;

namespace FattoVirtual.Domain.Entities;

public class Contract : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public ContractPartyType PartyType { get; set; }
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public string? PdfPath { get; set; }
}
