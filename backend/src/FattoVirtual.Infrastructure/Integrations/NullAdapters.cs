using FattoVirtual.Application.Abstractions.Integrations;
using Microsoft.Extensions.Logging;

namespace FattoVirtual.Infrastructure.Integrations;

/// <summary>
/// Adapter placeholder — troque por Google/Outlook sem alterar o domínio.
/// </summary>
public sealed class NullExternalCalendarProvider : IExternalCalendarProvider
{
    public string ProviderKey => "none";

    public Task<IReadOnlyList<ExternalCalendarEventDto>> ListEventsAsync(
        string accessToken,
        DateTimeRange utcRange,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<ExternalCalendarEventDto>>([]);
}

public sealed class LogNotificationDispatcher : INotificationDispatcher
{
    private readonly Microsoft.Extensions.Logging.ILogger<LogNotificationDispatcher> _logger;

    public LogNotificationDispatcher(Microsoft.Extensions.Logging.ILogger<LogNotificationDispatcher> logger) =>
        _logger = logger;

    public string ChannelKey => "log";

    public Task DispatchAsync(NotificationDispatchRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Dispatch [{Channel}] user={UserId} at={At}: {Title}",
            ChannelKey, request.UserId, request.OccursAtUtc, request.Title);
        return Task.CompletedTask;
    }
}
