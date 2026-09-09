using FattoVirtual.Domain.Entities;
using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FattoVirtual.Infrastructure.Services;

/// <summary>Gera alertas para tarefas atrasadas e reforça lembretes de agenda que passaram do horário.</summary>
public class TodoOverdueBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TodoOverdueBackgroundService> _logger;

    public TodoOverdueBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<TodoOverdueBackgroundService> logger)
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
                _logger.LogError(ex, "Falha ao processar alertas de atraso");
            }

            await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
        }
    }

    private async Task ProcessAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;

        await NotifyOverdueTodosAsync(db, now, ct);
        await NotifyMissedAgendaAsync(db, now, ct);
        await db.SaveChangesAsync(ct);
    }

    private static async Task NotifyOverdueTodosAsync(AppDbContext db, DateTime now, CancellationToken ct)
    {
        var overdue = await db.TodoItems
            .Where(t =>
                t.DueAtUtc != null &&
                t.DueAtUtc < now &&
                t.Status != TodoStatus.Done &&
                (t.OverdueNotifiedAtUtc == null || t.OverdueNotifiedAtUtc < now.AddHours(-12)))
            .Take(200)
            .ToListAsync(ct);

        foreach (var t in overdue)
        {
            var userId = t.AssignedUserId ?? t.CreatedByUserId;
            if (string.IsNullOrWhiteSpace(userId)) continue;

            var already = await db.AppNotifications.AnyAsync(n =>
                n.RelatedTodoItemId == t.Id &&
                n.Type == "todo_overdue" &&
                n.OccursAtUtc > now.AddHours(-12), ct);
            if (already)
            {
                t.OverdueNotifiedAtUtc = now;
                continue;
            }

            db.AppNotifications.Add(new AppNotification
            {
                OrganizationId = t.OrganizationId,
                UserId = userId,
                Title = "Tarefa atrasada",
                Body = t.Title,
                Link = "/todos",
                Type = "todo_overdue",
                OccursAtUtc = now,
                RelatedTodoItemId = t.Id,
                Priority = t.Priority is "Urgent" or "High" ? t.Priority : "High"
            });
            t.OverdueNotifiedAtUtc = now;
            t.UpdatedAt = now;
        }
    }

    private static async Task NotifyMissedAgendaAsync(AppDbContext db, DateTime now, CancellationToken ct)
    {
        var windowStart = now.AddHours(-6);
        var events = await db.AgendaEvents
            .Where(e =>
                e.StartsAt >= windowStart &&
                e.StartsAt < now.AddMinutes(-10) &&
                e.EndsAt >= now.AddMinutes(-30) &&
                e.OwnerUserId != null)
            .Take(100)
            .ToListAsync(ct);

        foreach (var ev in events)
        {
            var exists = await db.AppNotifications.AnyAsync(n =>
                n.RelatedAgendaEventId == ev.Id &&
                n.Type == "agenda_overdue" &&
                n.UserId == ev.OwnerUserId, ct);
            if (exists) continue;

            db.AppNotifications.Add(new AppNotification
            {
                OrganizationId = ev.OrganizationId,
                UserId = ev.OwnerUserId!,
                Title = "Compromisso passou do horário",
                Body = ev.Title,
                Link = "/agenda",
                Type = "agenda_overdue",
                OccursAtUtc = now,
                RelatedAgendaEventId = ev.Id,
                Priority = "High"
            });
        }
    }
}
