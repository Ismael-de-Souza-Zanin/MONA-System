using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

/// <summary>
/// Vínculo polimórfico de um movimento financeiro a outra entidade operacional
/// (tarefa, agenda, SOP, execução de SOP, serviço…). 0..N por pagamento; vários do mesmo tipo ok.
/// </summary>
public class PaymentLink : BaseEntity
{
    public Guid PaymentId { get; set; }
    public Payment Payment { get; set; } = null!;

    /// <summary>todo | agenda | sop | sop-run | service | contract</summary>
    public string EntityKind { get; set; } = string.Empty;
    public Guid EntityId { get; set; }

    /// <summary>Snapshot para listagens / chips sem join.</summary>
    public string Label { get; set; } = string.Empty;
    public string? Path { get; set; }
}
