namespace FattoVirtual.Domain.Time;

/// <summary>
/// Conversões de fuso com IANA (ex.: America/Sao_Paulo, America/New_York).
/// Assistentes com clientes globais devem sempre persistir UTC e exibir no TZ do usuário/cliente.
/// </summary>
public static class TimeZoneConvert
{
    public static DateTime ToUtc(DateTime localUnspecified, string timeZoneId)
    {
        var tz = Resolve(timeZoneId);
        var unspecified = DateTime.SpecifyKind(localUnspecified, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecified, tz);
    }

    public static DateTime FromUtc(DateTime utc, string timeZoneId)
    {
        var tz = Resolve(timeZoneId);
        var utcValue = DateTime.SpecifyKind(utc, DateTimeKind.Utc);
        return TimeZoneInfo.ConvertTimeFromUtc(utcValue, tz);
    }

    public static TimeZoneInfo Resolve(string? timeZoneId)
    {
        var id = string.IsNullOrWhiteSpace(timeZoneId) ? "America/Sao_Paulo" : timeZoneId;
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(id);
        }
        catch (Exception)
        {
            var windowsMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["America/Sao_Paulo"] = "E. South America Standard Time",
                ["America/New_York"] = "Eastern Standard Time",
                ["America/Chicago"] = "Central Standard Time",
                ["America/Denver"] = "Mountain Standard Time",
                ["America/Los_Angeles"] = "Pacific Standard Time",
                ["Europe/London"] = "GMT Standard Time",
                ["UTC"] = "UTC"
            };
            if (windowsMap.TryGetValue(id, out var windowsId))
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById(windowsId); }
                catch { /* fallthrough */ }
            }
            return TimeZoneInfo.Utc;
        }
    }

    public static IReadOnlyList<string> CommonAssistantZones { get; } =
    [
        "America/Sao_Paulo",
        "America/Manaus",
        "America/Fortaleza",
        "America/Recife",
        "America/New_York",
        "America/Chicago",
        "America/Denver",
        "America/Los_Angeles",
        "America/Toronto",
        "America/Mexico_City",
        "America/Bogota",
        "America/Argentina/Buenos_Aires",
        "Europe/Lisbon",
        "Europe/London",
        "Europe/Madrid",
        "Europe/Paris",
        "Europe/Berlin",
        "Asia/Dubai",
        "Asia/Tokyo",
        "Australia/Sydney",
        "Pacific/Auckland",
        "UTC"
    ];
}
