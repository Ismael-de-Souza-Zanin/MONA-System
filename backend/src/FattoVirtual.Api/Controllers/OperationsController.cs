using FattoVirtual.Domain.Enums;
using FattoVirtual.Domain.Time;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

/// <summary>
/// Fila de operação da assistente — agilidade com muitos clientes.
/// Organização por grupos/tags definidos pela própria org (sem catálogo de negócio do produto).
/// </summary>
[ApiController]
[Authorize]
[Route("api/v1/operations")]
public class OperationsController : ControllerBase
{
    private readonly AppDbContext _db;
    public OperationsController(AppDbContext db) => _db = db;

    [HttpGet("queue")]
    public async Task<IActionResult> Queue()
    {
        var orgId = User.GetOrganizationId();
        var uid = User.GetUserId();
        var now = DateTime.UtcNow;
        var horizon = now.AddHours(24);

        var pref = await _db.UserPreferences.FirstOrDefaultAsync(p =>
            p.UserId == uid && p.OrganizationId == orgId);
        var tz = pref?.EffectiveTimeZoneId ?? "America/Sao_Paulo";

        var openAlerts = await _db.AppNotifications
            .Where(n => n.OrganizationId == orgId && n.UserId == uid && n.ResolutionStatus == null)
            .OrderByDescending(n => n.Priority == "Urgent")
            .ThenByDescending(n => n.OccursAtUtc)
            .Take(20)
            .Select(n => new
            {
                id = n.Id,
                kind = "alert",
                title = n.Title,
                body = n.Body,
                link = n.Link ?? "/notificacoes",
                clientId = (Guid?)null,
                clientName = (string?)null,
                dueAtUtc = n.OccursAtUtc,
                priority = n.Priority,
                meta = n.Type
            })
            .ToListAsync();

        var todoQ = _db.TodoItems.Include(t => t.Client)
            .Where(t => t.OrganizationId == orgId && t.Status != TodoStatus.Done);
        if (!User.IsOwner() && !User.HasPermission(Permissions.TodosAll))
            todoQ = todoQ.Where(t => t.AssignedUserId == uid || t.Scope == TodoScope.General);

        var todos = await todoQ
            .Where(t => t.DueAtUtc == null || t.DueAtUtc <= horizon)
            .OrderBy(t => t.DueAtUtc == null)
            .ThenBy(t => t.DueAtUtc)
            .Take(25)
            .ToListAsync();

        var todoItems = todos.Select(t => new
        {
            id = t.Id,
            kind = t.DueAtUtc is not null && t.DueAtUtc < now ? "todo_overdue" : "todo",
            title = t.Title,
            body = t.Description,
            link = "/todos",
            clientId = t.ClientId,
            clientName = t.Client?.Name,
            dueAtUtc = t.DueAtUtc,
            priority = t.Priority,
            meta = t.Status.ToString()
        });

        var agendaQ = _db.AgendaEvents.Include(e => e.Client).ThenInclude(c => c!.ClientGroup)
            .Where(e => e.OrganizationId == orgId && e.StartsAt >= now && e.StartsAt <= horizon);
        if (!User.IsOwner() && !User.HasPermission(Permissions.AgendaOthers))
            agendaQ = agendaQ.Where(e => e.OwnerUserId == uid);

        var agenda = await agendaQ.OrderBy(e => e.StartsAt).Take(20).ToListAsync();
        var agendaItems = agenda.Select(e => new
        {
            id = e.Id,
            kind = "agenda",
            title = e.Title,
            body = $"{TimeZoneConvert.FromUtc(e.StartsAt, tz):g} ({tz}) · evento {e.TimeZoneId}",
            link = "/agenda",
            clientId = e.ClientId,
            clientName = e.Client?.Name,
            dueAtUtc = e.StartsAt,
            priority = "High",
            meta = e.Client?.ClientGroup?.Name
        });

        var clientsNeeding = await ClientScope.Query(_db, User)
            .Include(c => c.ClientGroup)
            .Where(c => c.NeedsQuickResponse || !c.OnboardingCompleted || c.Status == ClientStatus.Hold || c.Status == ClientStatus.Notice)
            .OrderByDescending(c => c.NeedsQuickResponse)
            .ThenBy(c => c.Name)
            .Take(20)
            .ToListAsync();

        var clientItems = clientsNeeding.Select(c => new
        {
            id = c.Id,
            kind = c.NeedsQuickResponse ? "quick_response" : "client_attention",
            title = c.Name,
            body = c.NeedsQuickResponse
                ? "Marcação: atendimento rápido"
                : (!c.OnboardingCompleted ? "Onboarding incompleto" : $"Status {c.Status}"),
            link = "/clientes/" + c.Id,
            clientId = (Guid?)c.Id,
            clientName = c.Name,
            dueAtUtc = (DateTime?)null,
            priority = c.NeedsQuickResponse ? "Urgent" : "Normal",
            meta = c.ClientGroup?.Name
        });

        var byGroup = await ClientScope.Query(_db, User)
            .GroupBy(c => c.ClientGroupId)
            .Select(g => new { groupId = g.Key, count = g.Count() })
            .ToListAsync();

        var groupNames = await _db.ClientGroups
            .Where(g => g.OrganizationId == orgId)
            .ToDictionaryAsync(g => g.Id, g => new { g.Name, g.Color });

        var org = await _db.Organizations.AsNoTracking().FirstAsync(o => o.Id == orgId);

        var queue = openAlerts.Cast<object>()
            .Concat(todoItems)
            .Concat(agendaItems)
            .Concat(clientItems)
            .ToList();

        return Ok(new
        {
            organization = new
            {
                name = org.Name,
                kind = org.Kind,
                defaultTimeZoneId = org.DefaultTimeZoneId,
                maxClients = org.MaxClients,
                maxAssistants = org.MaxAssistants
            },
            effectiveTimeZoneId = tz,
            summary = new
            {
                alerts = openAlerts.Count,
                todos = todos.Count,
                agenda = agenda.Count,
                clientsAttention = clientsNeeding.Count,
                total = queue.Count
            },
            byGroup = byGroup.Select(g => new
            {
                id = g.groupId,
                name = g.groupId is Guid id && groupNames.TryGetValue(id, out var n) ? n.Name : "Sem grupo",
                color = g.groupId is Guid id2 && groupNames.TryGetValue(id2, out var n2) ? n2.Color : "#94A3B8",
                count = g.count
            }).OrderByDescending(x => x.count),
            queue
        });
    }

    [HttpPost("clients/{id:guid}/quick-flag")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> ToggleQuick(Guid id, [FromBody] QuickFlagBody body)
    {
        var client = await ClientScope.Query(_db, User).FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return NotFound();
        client.NeedsQuickResponse = body.NeedsQuickResponse ?? !client.NeedsQuickResponse;
        client.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { id = client.Id, needsQuickResponse = client.NeedsQuickResponse });
    }

    public record QuickFlagBody(bool? NeedsQuickResponse);
}
