using FattoVirtual.Domain.Enums;
using FattoVirtual.Domain.Time;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/agenda")]
public class AgendaController : ControllerBase
{
    private readonly AppDbContext _db;
    public AgendaController(AppDbContext db) => _db = db;

    [HttpGet("events")]
    [RequirePermission(Permissions.AgendaRead)]
    public async Task<IActionResult> Events([FromQuery] string? view, [FromQuery] string? displayTimeZoneId)
    {
        var q = _db.AgendaEvents
            .Include(e => e.Category)
            .Include(e => e.ResponsibleEmployee)
            .Include(e => e.Client)
            .Include(e => e.LinkedTodos)
            .Where(e => e.OrganizationId == User.GetOrganizationId());

        if (view == "mine")
            q = q.Where(e => e.OwnerUserId == User.GetUserId());
        else if (view == "others")
        {
            if (!User.HasPermission(Permissions.AgendaOthers) && !User.IsOwner())
                return StatusCode(403, new { detail = "Sem permissão para ver reuniões alheias." });
            q = q.Where(e => e.OwnerUserId != User.GetUserId());
        }

        var displayTz = displayTimeZoneId ?? await EffectiveTzAsync();

        var items = await q.OrderBy(e => e.StartsAt).ToListAsync();
        return Ok(items.Select(e => Map(e, displayTz)));
    }

    [HttpPost("events")]
    [RequirePermission(Permissions.AgendaWrite)]
    public async Task<IActionResult> CreateEvent([FromBody] EventBody body)
    {
        var eventTz = !string.IsNullOrWhiteSpace(body.TimeZoneId)
            ? body.TimeZoneId!
            : body.ClientId is Guid clientId
                ? (await _db.Clients.Where(c => c.Id == clientId).Select(c => c.TimeZoneId).FirstOrDefaultAsync())
                  ?? "America/Sao_Paulo"
                : (await _db.UserPreferences.Where(p => p.UserId == User.GetUserId())
                      .Select(p => p.TimeZoneId).FirstOrDefaultAsync())
                  ?? "America/Sao_Paulo";

        var localStart = body.StartAt ?? body.StartsAt ?? DateTime.UtcNow;
        var localEnd = body.EndAt ?? body.EndsAt ?? localStart.AddHours(1);

        // Se o cliente enviar UTC explícito, respeita; senão interpreta no fuso do evento.
        DateTime startUtc;
        DateTime endUtc;
        if (body.IsUtc == true || localStart.Kind == DateTimeKind.Utc)
        {
            startUtc = DateTime.SpecifyKind(localStart, DateTimeKind.Utc);
            endUtc = DateTime.SpecifyKind(localEnd, DateTimeKind.Utc);
        }
        else
        {
            startUtc = TimeZoneConvert.ToUtc(localStart, eventTz);
            endUtc = TimeZoneConvert.ToUtc(localEnd, eventTz);
        }

        var e = new Domain.Entities.AgendaEvent
        {
            OrganizationId = User.GetOrganizationId(),
            Title = body.Title,
            Description = body.Description,
            StartsAt = startUtc,
            EndsAt = endUtc,
            TimeZoneId = eventTz,
            RemindMinutesBefore = body.RemindMinutesBefore ?? 30,
            CategoryId = body.CategoryId,
            ResponsibleEmployeeId = body.ResponsibleEmployeeId,
            ClientId = body.ClientId,
            OwnerUserId = body.ResponsibleUserId ?? User.GetUserId()
        };
        _db.AgendaEvents.Add(e);
        await _db.SaveChangesAsync();
        await _db.Entry(e).Reference(x => x.Category).LoadAsync();
        await _db.Entry(e).Reference(x => x.ResponsibleEmployee).LoadAsync();
        await _db.Entry(e).Reference(x => x.Client).LoadAsync();

        return Ok(Map(e, await EffectiveTzAsync()));
    }

    /// <summary>Gera tarefa a partir do evento — mesma cliente/contexto, ciclo de vida próprio.</summary>
    [HttpPost("events/{id:guid}/todos")]
    [RequirePermission(Permissions.AgendaWrite)]
    public async Task<IActionResult> CreateTodoFromEvent(Guid id, [FromBody] TodoFromEventBody? body)
    {
        if (!User.HasPermission(Permissions.TodosWrite) && !User.IsOwner())
            return StatusCode(403, new { detail = "Sem permissão de tarefas." });

        var ev = await _db.AgendaEvents.FirstOrDefaultAsync(e =>
            e.Id == id && e.OrganizationId == User.GetOrganizationId());
        if (ev is null) return NotFound();

        var todo = new Domain.Entities.TodoItem
        {
            OrganizationId = User.GetOrganizationId(),
            Title = body?.Title ?? $"Follow-up: {ev.Title}",
            Description = body?.Description ?? ev.Description,
            ClientId = ev.ClientId,
            AgendaEventId = ev.Id,
            AssignedUserId = ev.OwnerUserId ?? User.GetUserId(),
            CreatedByUserId = User.GetUserId(),
            DueAtUtc = ev.StartsAt,
            Priority = body?.Priority ?? "Normal",
            Status = TodoStatus.Todo,
            Scope = TodoScope.Personal
        };
        _db.TodoItems.Add(todo);
        await _db.SaveChangesAsync();
        return Ok(new { id = todo.Id, agendaEventId = ev.Id, title = todo.Title, dueAtUtc = todo.DueAtUtc });
    }

    [HttpDelete("events/{id:guid}")]
    [RequirePermission(Permissions.AgendaWrite)]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        var ev = await _db.AgendaEvents.FirstOrDefaultAsync(e =>
            e.Id == id && e.OrganizationId == User.GetOrganizationId());
        if (ev is null) return NotFound();
        _db.AgendaEvents.Remove(ev);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("categories")]
    [RequirePermission(Permissions.AgendaRead)]
    public async Task<IActionResult> Categories() =>
        Ok(await _db.AgendaCategories.Where(c => c.OrganizationId == User.GetOrganizationId())
            .OrderBy(c => c.Name)
            .Select(c => new { id = c.Id, name = c.Name, color = c.Color })
            .ToListAsync());

    [HttpPost("categories")]
    [RequirePermission(Permissions.AgendaWrite)]
    public async Task<IActionResult> CreateCategory([FromBody] CategoryBody body)
    {
        var c = new Domain.Entities.AgendaCategory
        {
            OrganizationId = User.GetOrganizationId(),
            Name = body.Name,
            Color = body.Color ?? "#006D69"
        };
        _db.AgendaCategories.Add(c);
        await _db.SaveChangesAsync();
        return Ok(new { id = c.Id, name = c.Name, color = c.Color });
    }

    [HttpDelete("categories/{id:guid}")]
    [RequirePermission(Permissions.AgendaWrite)]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        var c = await _db.AgendaCategories.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == User.GetOrganizationId());
        if (c is null) return NotFound();
        _db.AgendaCategories.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static object Map(Domain.Entities.AgendaEvent e, string displayTimeZoneId)
    {
        var startLocal = TimeZoneConvert.FromUtc(e.StartsAt, displayTimeZoneId);
        var endLocal = TimeZoneConvert.FromUtc(e.EndsAt, displayTimeZoneId);
        var startEventLocal = TimeZoneConvert.FromUtc(e.StartsAt, e.TimeZoneId);
        return new
        {
            id = e.Id,
            title = e.Title,
            description = e.Description,
            startAtUtc = e.StartsAt,
            endAtUtc = e.EndsAt,
            startAt = startLocal,
            endAt = endLocal,
            startAtEventLocal = startEventLocal,
            timeZoneId = e.TimeZoneId,
            displayTimeZoneId,
            remindMinutesBefore = e.RemindMinutesBefore,
            categoryId = e.CategoryId,
            categoryName = e.Category?.Name,
            categoryColor = e.Category?.Color,
            responsibleUserId = e.OwnerUserId,
            responsibleUserName = e.ResponsibleEmployee?.Name,
            responsibleColor = e.ResponsibleEmployee?.Color,
            clientId = e.ClientId,
            clientName = e.Client?.Name,
            clientTimeZoneId = e.Client?.TimeZoneId,
            linkedTodos = e.LinkedTodos.Select(t => new
            {
                id = t.Id,
                title = t.Title,
                status = t.Status.ToString(),
                dueAtUtc = t.DueAtUtc
            })
        };
    }

    private async Task<string> EffectiveTzAsync()
    {
        var pref = await _db.UserPreferences.FirstOrDefaultAsync(p =>
            p.UserId == User.GetUserId() && p.OrganizationId == User.GetOrganizationId());
        return pref?.EffectiveTimeZoneId ?? "America/Sao_Paulo";
    }

    public record EventBody(
        string Title,
        string? Description,
        DateTime? StartAt,
        DateTime? StartsAt,
        DateTime? EndAt,
        DateTime? EndsAt,
        string? TimeZoneId,
        bool? IsUtc,
        int? RemindMinutesBefore,
        Guid? CategoryId,
        Guid? ResponsibleEmployeeId,
        string? ResponsibleUserId,
        Guid? ClientId);
    public record CategoryBody(string Name, string? Color);
    public record TodoFromEventBody(string? Title, string? Description, string? Priority);
}
