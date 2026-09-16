using FattoVirtual.Domain.Entities;
using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1")]
public class TimeAttendanceController : ControllerBase
{
    private readonly AppDbContext _db;
    public TimeAttendanceController(AppDbContext db) => _db = db;

    [HttpGet("time-entries")]
    [RequirePermission(Permissions.TodosRead)]
    public async Task<IActionResult> ListTime(
        [FromQuery] Guid? clientId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var orgId = User.GetOrganizationId();
        var start = from ?? DateTime.UtcNow.Date.AddDays(-30);
        var end = to ?? DateTime.UtcNow.AddDays(1);
        var q = _db.TimeEntries.Include(t => t.Client)
            .Where(t => t.OrganizationId == orgId && t.StartedAtUtc >= start && t.StartedAtUtc < end);
        if (clientId is Guid cid) q = q.Where(t => t.ClientId == cid);
        if (!User.IsOwner() && !User.HasPermission(Permissions.FinanceAll))
            q = q.Where(t => t.UserId == User.GetUserId());

        var items = await q.OrderByDescending(t => t.StartedAtUtc).Take(400).ToListAsync();
        return Ok(items.Select(MapTime));
    }

    [HttpPost("time-entries")]
    [RequirePermission(Permissions.TodosWrite)]
    public async Task<IActionResult> CreateTime([FromBody] TimeBody body)
    {
        if (body.Minutes <= 0)
            return BadRequest(new { detail = "Informe os minutos." });
        if (body.ClientId is Guid cid)
        {
            var ok = await ClientScope.Query(_db, User).AnyAsync(c => c.Id == cid);
            if (!ok) return BadRequest(new { detail = "Cliente inválido." });
        }

        var e = new TimeEntry
        {
            OrganizationId = User.GetOrganizationId(),
            ClientId = body.ClientId,
            UserId = User.GetUserId(),
            EmployeeId = body.EmployeeId,
            Minutes = body.Minutes,
            StartedAtUtc = body.StartedAtUtc ?? DateTime.UtcNow,
            EndedAtUtc = body.EndedAtUtc,
            Note = body.Note,
            Billable = body.Billable ?? true,
            TodoItemId = body.TodoItemId,
            AgendaEventId = body.AgendaEventId
        };
        _db.TimeEntries.Add(e);
        await _db.SaveChangesAsync();
        await _db.Entry(e).Reference(x => x.Client).LoadAsync();
        return Ok(MapTime(e));
    }

    [HttpGet("attendance-points")]
    [RequirePermission(Permissions.ClientsRead)]
    public async Task<IActionResult> ListPoints([FromQuery] Guid? clientId)
    {
        var orgId = User.GetOrganizationId();
        var q = _db.AttendancePoints.Include(p => p.Client).Include(p => p.ServiceItem).Include(p => p.Sop)
            .Where(p => p.OrganizationId == orgId);
        if (clientId is Guid cid) q = q.Where(p => p.ClientId == cid);
        else if (!User.IsOwner())
        {
            var ids = User.GetAssignedClientIds();
            q = q.Where(p => ids.Contains(p.ClientId));
        }

        var items = await q.OrderBy(p => p.Name).ToListAsync();
        return Ok(items.Select(MapPoint));
    }

    [HttpPost("attendance-points")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> CreatePoint([FromBody] PointBody body)
    {
        if (string.IsNullOrWhiteSpace(body.Name) || body.ClientId == Guid.Empty)
            return BadRequest(new { detail = "Informe cliente e nome do ponto." });
        var ok = await ClientScope.Query(_db, User).AnyAsync(c => c.Id == body.ClientId);
        if (!ok) return BadRequest(new { detail = "Cliente inválido." });

        var p = new AttendancePoint
        {
            OrganizationId = User.GetOrganizationId(),
            ClientId = body.ClientId,
            ServiceItemId = body.ServiceItemId,
            SopId = body.SopId,
            Name = body.Name.Trim(),
            Channel = string.IsNullOrWhiteSpace(body.Channel) ? "WhatsApp" : body.Channel.Trim(),
            WindowNote = body.WindowNote,
            SlaMinutes = body.SlaMinutes,
            IntakeNotes = body.IntakeNotes,
            EscalationNotes = body.EscalationNotes
        };
        _db.AttendancePoints.Add(p);
        await _db.SaveChangesAsync();
        await _db.Entry(p).Reference(x => x.Client).LoadAsync();
        await _db.Entry(p).Reference(x => x.ServiceItem).LoadAsync();
        return Ok(MapPoint(p));
    }

    [HttpPatch("clients/{id:guid}/retainer")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> SetRetainer(Guid id, [FromBody] RetainerBody body)
    {
        var client = await ClientScope.Query(_db, User).FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return NotFound();
        client.RetainerHoursPerMonth = Math.Max(0, body.HoursPerMonth);
        client.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { id = client.Id, retainerHoursPerMonth = client.RetainerHoursPerMonth });
    }

    private static object MapTime(TimeEntry t) => new
    {
        id = t.Id,
        clientId = t.ClientId,
        clientName = t.Client?.Name,
        userId = t.UserId,
        minutes = t.Minutes,
        startedAtUtc = t.StartedAtUtc,
        endedAtUtc = t.EndedAtUtc,
        note = t.Note,
        billable = t.Billable
    };

    private static object MapPoint(AttendancePoint p) => new
    {
        id = p.Id,
        clientId = p.ClientId,
        clientName = p.Client?.Name,
        serviceItemId = p.ServiceItemId,
        serviceName = p.ServiceItem?.Title,
        sopId = p.SopId,
        sopName = p.Sop?.Name,
        name = p.Name,
        channel = p.Channel,
        windowNote = p.WindowNote,
        slaMinutes = p.SlaMinutes,
        intakeNotes = p.IntakeNotes,
        escalationNotes = p.EscalationNotes,
        isActive = p.IsActive
    };

    public record TimeBody(
        int Minutes,
        Guid? ClientId,
        Guid? EmployeeId,
        DateTime? StartedAtUtc,
        DateTime? EndedAtUtc,
        string? Note,
        bool? Billable,
        Guid? TodoItemId,
        Guid? AgendaEventId);

    public record PointBody(
        Guid ClientId,
        string Name,
        string? Channel,
        Guid? ServiceItemId,
        Guid? SopId,
        string? WindowNote,
        int? SlaMinutes,
        string? IntakeNotes,
        string? EscalationNotes);

    public record RetainerBody(decimal HoursPerMonth);
}
