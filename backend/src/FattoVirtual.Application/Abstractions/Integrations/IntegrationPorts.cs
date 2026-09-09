namespace FattoVirtual.Application.Abstractions.Integrations;

/// <summary>
/// Porta para provedores externos de calendário (Google, Outlook, etc.).
/// Implementações ficam em Infrastructure/Integrations.
/// </summary>
public interface IExternalCalendarProvider
{
    string ProviderKey { get; }
    Task<IReadOnlyList<ExternalCalendarEventDto>> ListEventsAsync(
        string accessToken,
        DateTimeRange utcRange,
        CancellationToken cancellationToken = default);
}

public sealed record ExternalCalendarEventDto(
    string ExternalId,
    string Title,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string? TimeZoneId);

public sealed record DateTimeRange(DateTime FromUtc, DateTime ToUtc);

/// <summary>
/// Porta para canais de notificação externos (e-mail, WhatsApp, push).
/// O núcleo gera AppNotification interna; adapters opcionais enviam para fora.
/// </summary>
public interface INotificationDispatcher
{
    string ChannelKey { get; }
    Task DispatchAsync(NotificationDispatchRequest request, CancellationToken cancellationToken = default);
}

public sealed record NotificationDispatchRequest(
    string UserId,
    string Title,
    string Body,
    string? Link,
    DateTime OccursAtUtc);
