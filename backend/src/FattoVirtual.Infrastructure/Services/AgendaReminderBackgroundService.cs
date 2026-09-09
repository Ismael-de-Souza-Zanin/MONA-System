using FattoVirtual.Domain.Entities;
using FattoVirtual.Domain.Time;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FattoVirtual.Infrastructure.Services;

/// <summary>
/// Gera notificações internas a partir da agenda, usando horários em UTC.
/// A UI converte para o fuso da assistente.
/// </summary>
public class AgendaReminderBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AgendaReminderBackgroundService> _logger;

    public AgendaReminderBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<AgendaReminderBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha ao processar lembretes de agenda");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task ProcessAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;
        var horizon = now.AddHours(48);

        var events = await db.AgendaEvents
            .Where(e => !e.ReminderCreated && e.StartsAt <= horizon && e.StartsAt >= now.AddMinutes(-5))
            .ToListAsync(ct);

        foreach (var ev in events)
        {
            var remindAt = ev.StartsAt.AddMinutes(-Math.Abs(ev.RemindMinutesBefore));
            if (remindAt > now.AddMinutes(1)) continue;
            if (string.IsNullOrWhiteSpace(ev.OwnerUserId)) continue;

            var exists = await db.AppNotifications.AnyAsync(n =>
                n.RelatedAgendaEventId == ev.Id && n.UserId == ev.OwnerUserId, ct);
            if (!exists)
            {
                var localStart = TimeZoneConvert.FromUtc(ev.StartsAt, ev.TimeZoneId);
                db.AppNotifications.Add(new AppNotification
                {
                    OrganizationId = ev.OrganizationId,
                    UserId = ev.OwnerUserId,
                    Title = "Lembrete de agenda",
                    Body = $"{ev.Title} às {localStart:HH:mm} ({ev.TimeZoneId})",
                    Link = "/agenda",
                    Type = "agenda",
                    OccursAtUtc = remindAt < now ? now : remindAt,
                    RelatedAgendaEventId = ev.Id
                });
            }

            ev.ReminderCreated = true;
            ev.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }
}
