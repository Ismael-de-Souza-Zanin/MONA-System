using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class Invoice : BaseEntity
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public string Reference { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }
    public string Status { get; set; } = "Open";
    /// <summary>AgencyFee | ClientCustomer — NF da operação vs NF gerida para cliente do cliente.</summary>
    public string Kind { get; set; } = "AgencyFee";
    public string? CounterpartyName { get; set; }
    public DateOnly? DueDate { get; set; }
    public string? Notes { get; set; }
}
