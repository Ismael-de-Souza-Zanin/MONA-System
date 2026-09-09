using FattoVirtual.Domain.Common;

namespace FattoVirtual.Domain.Entities;

public class UserPreference : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public string UserId { get; set; } = string.Empty;
    /// <summary>Fuso “casa” (base da assistente).</summary>
    public string TimeZoneId { get; set; } = "America/Sao_Paulo";
    /// <summary>Fuso detectado pelo browser/dispositivo (atualiza ao viajar).</summary>
    public string? DetectedTimeZoneId { get; set; }
    /// <summary>Quando true, EffectiveTimeZoneId usa TravelTimeZoneId.</summary>
    public bool TravelModeEnabled { get; set; }
    /// <summary>Fuso temporário em viagem (IANA).</summary>
    public string? TravelTimeZoneId { get; set; }
    public string? TravelLabel { get; set; }
    public DateTime? TravelEndsAtUtc { get; set; }
    /// <summary>Ordem e visibilidade do menu.</summary>
    public List<MenuItemPreference> MenuItems { get; set; } = [];

    /// <summary>Fuso efetivo para UI, agenda e lembretes da assistente.</summary>
    public string EffectiveTimeZoneId
    {
        get
        {
            if (TravelModeEnabled && !string.IsNullOrWhiteSpace(TravelTimeZoneId))
            {
                if (TravelEndsAtUtc is null || TravelEndsAtUtc > DateTime.UtcNow)
                    return TravelTimeZoneId!;
            }
            return TimeZoneId;
        }
    }
}

public class MenuItemPreference
{
    public string Key { get; set; } = string.Empty;
    public bool Visible { get; set; } = true;
    public string? CustomLabel { get; set; }
}
