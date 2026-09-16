using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class Payment : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? DueAt { get; set; }
    public bool IsSettled { get; set; }
    public string? TargetUserId { get; set; }
    /// <summary>
    /// Agency = Fatto recebe do cliente (plano B);
    /// ClientAr / ClientAp = negócio do cliente (plano A);
    /// AssistantPayout = Fatto paga a VA (plano C — cliente nunca vê).
    /// </summary>
    public string Ledger { get; set; } = "Agency";
    /// <summary>Nome do terceiro (pagante ou fornecedor), quando Ledger ≠ Agency.</summary>
    public string? CounterpartyName { get; set; }
    public string? Category { get; set; }
    public Guid? InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }
    /// <summary>Proof | AdminPassword</summary>
    public string? SettleMethod { get; set; }
    public string? ProofFileName { get; set; }
    public string? ProofStoredName { get; set; }
    public string? SettledByUserId { get; set; }

    /// <summary>Vínculos a tarefas, agenda, SOPs, serviços etc. (0..N de cada tipo).</summary>
    public ICollection<PaymentLink> Links { get; set; } = [];
}
