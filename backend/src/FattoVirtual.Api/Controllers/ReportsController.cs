using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/reports")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportsController(AppDbContext db) => _db = db;

    [HttpGet]
    [RequirePermission(Permissions.Dashboard)]
    public async Task<IActionResult> Get(
        [FromQuery] string? lens,
        [FromQuery] string? period,
        [FromQuery] Guid? clientId)
    {
        var orgId = User.GetOrganizationId();
        var uid = User.GetUserId();
        var canAdm = User.IsOwner() || User.HasPermission(Permissions.FinanceAll);
        var resolvedLens = (lens ?? (canAdm ? "adm" : "va")).ToLowerInvariant();
        if (resolvedLens == "adm" && !canAdm) resolvedLens = "va";
        if (resolvedLens == "client" && clientId is null)
            return BadRequest(new { detail = "Relatório do cliente exige clientId." });

        var (from, to) = Range(period);
        var clientIds = ClientScope.Query(_db, User).Select(c => c.Id);
        if (clientId is Guid cid)
            clientIds = clientIds.Where(id => id == cid);

        var todosQ = _db.TodoItems.Where(t => t.OrganizationId == orgId && t.CreatedAt < to &&
            (t.ClientId == null || clientIds.Contains(t.ClientId.Value)));
        if (resolvedLens == "va")
            todosQ = todosQ.Where(t => t.AssignedUserId == uid || t.CreatedByUserId == uid);

        var done = await todosQ.CountAsync(t => t.Status == TodoStatus.Done && t.UpdatedAt >= from);
        var open = await todosQ.CountAsync(t => t.Status != TodoStatus.Done);
        var overdue = await todosQ.CountAsync(t =>
            t.Status != TodoStatus.Done && t.DueAtUtc != null && t.DueAtUtc < DateTime.UtcNow);

        var agendaQ = _db.AgendaEvents.Where(e => e.OrganizationId == orgId &&
            e.StartsAt >= from && e.StartsAt < to &&
            (e.ClientId == null || clientIds.Contains(e.ClientId.Value)));
        if (resolvedLens == "va")
            agendaQ = agendaQ.Where(e => e.OwnerUserId == uid);

        var meetings = await agendaQ.CountAsync(e => e.Kind == "Meeting");
        var events = await agendaQ.CountAsync();

        var decQ = _db.BusinessDecisions.Where(d => d.OrganizationId == orgId &&
            d.CreatedAt >= from && d.CreatedAt < to &&
            (d.ClientId == null || clientIds.Contains(d.ClientId.Value)));
        if (resolvedLens == "client")
            decQ = decQ.Where(d => d.VisibleToClient);
        var decisionsTotal = await decQ.CountAsync();
        var decisionsOpen = await decQ.CountAsync(d => d.IsOpen);

        var sopRuns = await _db.SopRuns.CountAsync(r =>
            r.OrganizationId == orgId && r.CompletedAtUtc != null &&
            r.CompletedAtUtc >= from && r.CompletedAtUtc < to);

        var timeQ = _db.TimeEntries.Where(t => t.OrganizationId == orgId &&
            t.StartedAtUtc >= from && t.StartedAtUtc < to &&
            (t.ClientId == null || clientIds.Contains(t.ClientId.Value)));
        if (resolvedLens == "va")
            timeQ = timeQ.Where(t => t.UserId == uid);
        var minutes = await timeQ.SumAsync(t => (int?)t.Minutes) ?? 0;

        var retainerHours = clientId is Guid rcid
            ? await _db.Clients.Where(c => c.Id == rcid).Select(c => c.RetainerHoursPerMonth).FirstOrDefaultAsync()
            : await ClientScope.Query(_db, User).SumAsync(c => (decimal?)c.RetainerHoursPerMonth) ?? 0;

        var payQ = _db.Payments.Where(p => p.OrganizationId == orgId &&
            (p.PaidAt ?? p.DueAt ?? p.CreatedAt) >= from &&
            (p.PaidAt ?? p.DueAt ?? p.CreatedAt) < to &&
            (p.ClientId == null || clientIds.Contains(p.ClientId.Value)));

        static (decimal paid, decimal pending) Slice(IEnumerable<Domain.Entities.Payment> list, string ledger)
        {
            var s = list.Where(p => (string.IsNullOrWhiteSpace(p.Ledger) ? "Agency" : p.Ledger) == ledger).ToList();
            return (s.Where(p => p.IsSettled).Sum(p => p.Amount), s.Where(p => !p.IsSettled).Sum(p => p.Amount));
        }

        var payments = await payQ.ToListAsync();
        var agency = Slice(payments, "Agency");
        var ar = Slice(payments, "ClientAr");
        var ap = Slice(payments, "ClientAp");
        var payoutAll = Slice(payments, "AssistantPayout");
        var myPayout = Slice(payments.Where(p => p.TargetUserId == uid || (p.EmployeeId != null && resolvedLens == "va")), "AssistantPayout");

        object? money = resolvedLens switch
        {
            "client" => new { agency, clientAr = ar, clientAp = ap },
            "va" => new { agency, payout = myPayout },
            _ => new
            {
                agency,
                clientAr = ar,
                clientAp = ap,
                payout = payoutAll,
                marginPaid = agency.paid - payoutAll.paid
            }
        };

        var scopedClients = await ClientScope.Query(_db, User)
            .Where(c => clientId == null || c.Id == clientId)
            .Select(c => new { c.Id, c.Name, c.RetainerHoursPerMonth })
            .ToListAsync();
        var todoByClient = await _db.TodoItems
            .Where(t => t.OrganizationId == orgId && t.Status == TodoStatus.Done && t.UpdatedAt >= from && t.UpdatedAt < to)
            .GroupBy(t => t.ClientId)
            .Select(g => new { ClientId = g.Key, Count = g.Count() })
            .ToListAsync();
        var timeByClient = await _db.TimeEntries
            .Where(t => t.OrganizationId == orgId && t.StartedAtUtc >= from && t.StartedAtUtc < to)
            .GroupBy(t => t.ClientId)
            .Select(g => new { ClientId = g.Key, Minutes = g.Sum(x => x.Minutes) })
            .ToListAsync();
        var byClient = scopedClients
            .Select(c => new
            {
                clientId = c.Id,
                name = c.Name,
                retainerHours = c.RetainerHoursPerMonth,
                todosDone = todoByClient.FirstOrDefault(x => x.ClientId == c.Id)?.Count ?? 0,
                minutes = timeByClient.FirstOrDefault(x => x.ClientId == c.Id)?.Minutes ?? 0
            })
            .OrderByDescending(x => x.todosDone)
            .Take(40)
            .ToList();

        var recentTodos = await todosQ.Where(t => t.Status == TodoStatus.Done && t.UpdatedAt >= from)
            .OrderByDescending(t => t.UpdatedAt).Take(12)
            .Select(t => new { t.Id, t.Title, t.ClientId, clientName = t.Client != null ? t.Client.Name : null, at = t.UpdatedAt })
            .ToListAsync();

        var recentDecisions = await decQ.OrderByDescending(d => d.CreatedAt).Take(12)
            .Select(d => new { d.Id, d.Title, d.VisibleToClient, d.IsOpen, d.ClientId, clientName = d.Client != null ? d.Client.Name : null, d.CreatedAt })
            .ToListAsync();

        return Ok(new
        {
            lens = resolvedLens,
            period = string.IsNullOrWhiteSpace(period) ? "week" : period,
            from,
            to,
            todos = new { done, open, overdue },
            agenda = new { meetings, events },
            decisions = new { total = decisionsTotal, open = decisionsOpen },
            sops = new { completedRuns = sopRuns },
            time = new
            {
                minutes,
                hours = Math.Round(minutes / 60m, 2),
                retainerHours,
                retainerUsedHours = Math.Round(minutes / 60m, 2)
            },
            money,
            byClient,
            evidence = new { todos = recentTodos, decisions = recentDecisions }
        });
    }

    private static (DateTime from, DateTime to) Range(string? period)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        return (period ?? "week") switch
        {
            "day" => (today, today.AddDays(1)),
            "month" => (new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1)),
            _ => (today.AddDays(-(int)today.DayOfWeek), today.AddDays(8 - (int)today.DayOfWeek))
        };
    }
}
