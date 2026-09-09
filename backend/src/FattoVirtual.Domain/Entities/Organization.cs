using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class Organization : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Document { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? SupportWhatsAppUrl { get; set; }
    /// <summary>Agency | Independent | Partner — escala multi-empresa / autônomas.</summary>
    public string Kind { get; set; } = "Agency";
    public string? BrandPrimaryColor { get; set; }
    public string DefaultTimeZoneId { get; set; } = "America/Sao_Paulo";
    public string DefaultLocale { get; set; } = "pt-BR";
    /// <summary>Limite soft de clientes (plano futuro SaaS).</summary>
    public int? MaxClients { get; set; }
    public int? MaxAssistants { get; set; }

    public ICollection<AccessType> AccessTypes { get; set; } = [];
    public ICollection<Client> Clients { get; set; } = [];
    public ICollection<Employee> Employees { get; set; } = [];
}
