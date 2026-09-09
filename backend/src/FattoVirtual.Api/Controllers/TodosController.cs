using FattoVirtual.Domain.Enums;
using FattoVirtual.Domain.Time;
using FattoVirtual.Infrastructure.Identity;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/todos")]
public class TodosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _users;

    public TodosController(AppDbContext db, UserManager<AppUser> users)
    {
        _db = db;
        _users = users;
    }

    [HttpGet]
    [RequirePermission(Permissions.TodosRead)]
    public async Task<IActionResult> List([FromQuery] string? ownerId, [FromQuery] Guid? clientId, [FromQuery] Guid? agendaEventId)
    {
        var q = _db.TodoItems.Include(t => t.Comments).Include(t => t.Client).Include(t => t.AgendaEvent)
            .Include(t => t.BoardColumn)
            .Where(t => t.OrganizationId == User.GetOrganizationId());

        if (User.HasPermission(Permissions.TodosAll) || User.IsOwner())
        {
            if (!string.IsNullOrWhiteSpace(ownerId) && ownerId != "all")
                q = q.Where(t => t.AssignedUserId == ownerId || t.Scope == TodoScope.General);
        }
        else
        {
            var uid = User.GetUserId();
            q = q.Where(t => t.AssignedUserId == uid || t.Scope == TodoScope.General);
        }

        if (clientId.HasValue) q = q.Where(t => t.ClientId == clientId);
        if (agendaEventId.HasValue) q = q.Where(t => t.AgendaEventId == agendaEventId);

        var users = await _db.Users.Where(u => u.OrganizationId == User.GetOrganizationId())
            .ToDictionaryAsync(u => u.Id, u => u.FullName);
        var tz = await EffectiveTzAsync();

        var items = await q.OrderByDescending(t => t.DueAtUtc.HasValue)
            .ThenBy(t => t.DueAtUtc)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();
        return Ok(items.Select(t => Map(t, users, tz)));
    }

    [HttpPost]
    [RequirePermission(Permissions.TodosWrite)]
    public async Task<IActionResult> Create([FromBody] TodoBody body)
    {
        var scope = body.IsGeneral == true || string.Equals(body.Scope, "General", StringComparison.OrdinalIgnoreCase)
            ? TodoScope.General
            : TodoScope.Personal;

        var tz = body.TimeZoneId ?? await EffectiveTzAsync();
        DateTime? dueUtc = null;
        if (body.DueAt.HasValue)
        {
            dueUtc = body.DueAtIsUtc == true
                ? DateTime.SpecifyKind(body.DueAt.Value, DateTimeKind.Utc)
                : TimeZoneConvert.ToUtc(body.DueAt.Value, tz);
        }

        Guid? clientId = body.ClientId;
        if (body.AgendaEventId is Guid eventId)
        {
            var ev = await _db.AgendaEvents.FirstOrDefaultAsync(e =>
                e.Id == eventId && e.OrganizationId == User.GetOrganizationId());
            if (ev is null) return BadRequest(new { detail = "Evento de agenda não encontrado." });
            clientId ??= ev.ClientId;
        }

        var orgId = User.GetOrganizationId();
        var columnId = body.BoardColumnId;
        if (columnId is null)
        {
            columnId = await _db.TodoBoardColumns
                .Where(c => c.OrganizationId == orgId && !c.MarksComplete)
                .OrderBy(c => c.SortOrder)
                .Select(c => (Guid?)c.Id)
                .FirstOrDefaultAsync();
        }

        Domain.Entities.TodoBoardColumn? column = null;
        if (columnId is Guid cid)
            column = await _db.TodoBoardColumns.FirstOrDefaultAsync(c => c.Id == cid && c.OrganizationId == orgId);

        var todo = new Domain.Entities.TodoItem
        {
            OrganizationId = orgId,
            Title = body.Title,
            Description = body.Description,
            Scope = scope,
            AssignedUserId = body.OwnerUserId ?? body.AssignedUserId ?? User.GetUserId(),
            ClientId = clientId,
            CreatedByUserId = User.GetUserId(),
            Status = column?.MarksComplete == true ? TodoStatus.Done : TodoStatus.Todo,
            BoardColumnId = column?.Id,
            DueAtUtc = dueUtc,
            Priority = body.Priority ?? "Normal",
            Tags = body.Tags ?? [],
            AgendaEventId = body.AgendaEventId
        };
        _db.TodoItems.Add(todo);
        await _db.SaveChangesAsync();
        await _db.Entry(todo).Reference(t => t.Client).LoadAsync();
        await _db.Entry(todo).Reference(t => t.AgendaEvent).LoadAsync();
        await _db.Entry(todo).Reference(t => t.BoardColumn).LoadAsync();
        var users = await _db.Users.Where(u => u.OrganizationId == orgId)
            .ToDictionaryAsync(u => u.Id, u => u.FullName);
        return Ok(Map(todo, users, tz));
    }

    [HttpPatch("{id:guid}")]
    [RequirePermission(Permissions.TodosWrite)]
    public async Task<IActionResult> Patch(Guid id, [FromBody] TodoPatchBody body)
    {
        var todo = await _db.TodoItems.Include(t => t.Comments).Include(t => t.Client).Include(t => t.AgendaEvent)
            .Include(t => t.BoardColumn)
            .FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == User.GetOrganizationId());
        if (todo is null) return NotFound();

        if (body.BoardColumnId.HasValue)
        {
            var col = await _db.TodoBoardColumns.FirstOrDefaultAsync(c =>
                c.Id == body.BoardColumnId && c.OrganizationId == User.GetOrganizationId());
            if (col is null) return BadRequest(new { detail = "Coluna inválida." });
            todo.BoardColumnId = col.Id;
            todo.BoardColumn = col;
            todo.Status = col.MarksComplete
                ? TodoStatus.Done
                : col.SortOrder <= 0 ? TodoStatus.Todo : TodoStatus.InProgress;
            if (todo.Status != TodoStatus.Done) todo.OverdueNotifiedAtUtc = null;
        }
        else if (!string.IsNullOrWhiteSpace(body.Status) && Enum.TryParse<TodoStatus>(body.Status, true, out var status))
        {
            todo.Status = status;
            var orgId = User.GetOrganizationId();
            var cols = await _db.TodoBoardColumns.Where(c => c.OrganizationId == orgId).OrderBy(c => c.SortOrder).ToListAsync();
            if (cols.Count > 0)
            {
                todo.BoardColumnId = status switch
                {
                    TodoStatus.Done => cols.FirstOrDefault(c => c.MarksComplete)?.Id ?? cols.Last().Id,
                    TodoStatus.InProgress => cols.Skip(1).FirstOrDefault(c => !c.MarksComplete)?.Id ?? cols[0].Id,
                    _ => cols[0].Id
                };
            }
        }

        if (body.Title is not null) todo.Title = body.Title;
        if (body.Description is not null) todo.Description = body.Description;
        if (body.Priority is not null) todo.Priority = body.Priority;
        if (body.Tags is not null) todo.Tags = body.Tags;
        if (body.ClientId.HasValue) todo.ClientId = body.ClientId;
        if (body.AssignedUserId is not null) todo.AssignedUserId = body.AssignedUserId;
        if (body.AgendaEventId.HasValue) todo.AgendaEventId = body.AgendaEventId == Guid.Empty ? null : body.AgendaEventId;
        if (body.ClearDueAt == true) todo.DueAtUtc = null;
        else if (body.DueAt.HasValue)
        {
            var tz = body.TimeZoneId ?? await EffectiveTzAsync();
            todo.DueAtUtc = body.DueAtIsUtc == true
                ? DateTime.SpecifyKind(body.DueAt.Value, DateTimeKind.Utc)
                : TimeZoneConvert.ToUtc(body.DueAt.Value, tz);
            todo.OverdueNotifiedAtUtc = null;
        }
        todo.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        var users = await _db.Users.Where(u => u.OrganizationId == User.GetOrganizationId())
            .ToDictionaryAsync(u => u.Id, u => u.FullName);
        return Ok(Map(todo, users, await EffectiveTzAsync()));
    }

    [HttpPost("{id:guid}/comments")]
    [RequirePermission(Permissions.TodosWrite)]
    public async Task<IActionResult> Comment(Guid id, [FromBody] CommentBody body)
    {
        var todo = await _db.TodoItems.Include(t => t.Comments).Include(t => t.Client).Include(t => t.AgendaEvent)
            .FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == User.GetOrganizationId());
        if (todo is null) return NotFound();

        var comment = new Domain.Entities.TodoComment
        {
            TodoItemId = id,
            AuthorUserId = User.GetUserId(),
            Content = body.Content,
            NotifyOwner = body.NotifyOwner
        };
        _db.TodoComments.Add(comment);

        if (body.NotifyOwner && todo.AssignedUserId is not null && todo.AssignedUserId != User.GetUserId())
        {
            _db.AppNotifications.Add(new Domain.Entities.AppNotification
            {
                OrganizationId = User.GetOrganizationId(),
                UserId = todo.AssignedUserId,
                Title = "Comentário na tarefa",
                Body = $"{todo.Title}: {body.Content}",
                Link = "/todos",
                Type = "todo",
                OccursAtUtc = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        var users = await _db.Users.Where(u => u.OrganizationId == User.GetOrganizationId())
            .ToDictionaryAsync(u => u.Id, u => u.FullName);
        return Ok(Map(todo, users, await EffectiveTzAsync()));
    }

    /// <summary>Cria evento de agenda a partir da tarefa (contexto compartilhado, propósitos distintos).</summary>
    [HttpPost("{id:guid}/schedule")]
    [RequirePermission(Permissions.TodosWrite)]
    public async Task<IActionResult> ScheduleFromTodo(Guid id, [FromBody] ScheduleFromTodoBody body)
    {
        if (!User.HasPermission(Permissions.AgendaWrite) && !User.IsOwner())
            return StatusCode(403, new { detail = "Sem permissão de agenda." });

        var todo = await _db.TodoItems.FirstOrDefaultAsync(t =>
            t.Id == id && t.OrganizationId == User.GetOrganizationId());
        if (todo is null) return NotFound();

        var tz = body.TimeZoneId ?? await EffectiveTzAsync();
        var startLocal = body.StartAt;
        var endLocal = body.EndAt ?? startLocal.AddHours(1);
        var startUtc = body.IsUtc == true
            ? DateTime.SpecifyKind(startLocal, DateTimeKind.Utc)
            : TimeZoneConvert.ToUtc(startLocal, tz);
        var endUtc = body.IsUtc == true
            ? DateTime.SpecifyKind(endLocal, DateTimeKind.Utc)
            : TimeZoneConvert.ToUtc(endLocal, tz);

        var ev = new Domain.Entities.AgendaEvent
        {
            OrganizationId = User.GetOrganizationId(),
            Title = body.Title ?? todo.Title,
            Description = todo.Description,
            StartsAt = startUtc,
            EndsAt = endUtc,
            TimeZoneId = tz,
            ClientId = todo.ClientId,
            OwnerUserId = todo.AssignedUserId ?? User.GetUserId(),
            RemindMinutesBefore = body.RemindMinutesBefore ?? 30
        };
        _db.AgendaEvents.Add(ev);
        await _db.SaveChangesAsync();
        todo.AgendaEventId = ev.Id;
        if (todo.DueAtUtc is null) todo.DueAtUtc = startUtc;
        todo.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { agendaEventId = ev.Id, todoId = todo.Id });
    }

    private async Task<string> EffectiveTzAsync()
    {
        var pref = await _db.UserPreferences.FirstOrDefaultAsync(p =>
            p.UserId == User.GetUserId() && p.OrganizationId == User.GetOrganizationId());
        return pref?.EffectiveTimeZoneId ?? "America/Sao_Paulo";
    }

    private static object Map(Domain.Entities.TodoItem t, Dictionary<string, string> users, string displayTz)
    {
        var overdue = t.DueAtUtc is DateTime due && due < DateTime.UtcNow && t.Status != TodoStatus.Done;
        return new
        {
            id = t.Id,
            title = t.Title,
            description = t.Description,
            status = t.Status.ToString(),
            boardColumnId = t.BoardColumnId,
            boardColumnName = t.BoardColumn?.Name,
            priority = t.Priority,
            tags = t.Tags,
            ownerUserId = t.AssignedUserId,
            ownerUserName = t.AssignedUserId is null ? null : users.GetValueOrDefault(t.AssignedUserId),
            clientId = t.ClientId,
            clientName = t.Client?.Name,
            isGeneral = t.Scope == TodoScope.General,
            dueAtUtc = t.DueAtUtc,
            dueAtLocal = t.DueAtUtc is null ? (DateTime?)null : TimeZoneConvert.FromUtc(t.DueAtUtc.Value, displayTz),
            displayTimeZoneId = displayTz,
            isOverdue = overdue,
            agendaEventId = t.AgendaEventId,
            agendaEventTitle = t.AgendaEvent?.Title,
            comments = t.Comments.OrderBy(c => c.CreatedAt).Select(c => new
            {
                id = c.Id,
                authorName = users.GetValueOrDefault(c.AuthorUserId, "Usuário"),
                content = c.Content,
                createdAt = c.CreatedAt
            })
        };
    }

    public record TodoBody(
        string Title, string? Description, bool? IsGeneral, string? Scope,
        string? OwnerUserId, string? AssignedUserId, Guid? ClientId,
        DateTime? DueAt, bool? DueAtIsUtc, string? TimeZoneId, string? Priority, Guid? AgendaEventId,
        Guid? BoardColumnId, List<string>? Tags);
    public record TodoPatchBody(
        string? Status, string? Title, string? Description, string? Priority,
        Guid? ClientId, Guid? AgendaEventId, DateTime? DueAt, bool? DueAtIsUtc, string? TimeZoneId, bool? ClearDueAt,
        Guid? BoardColumnId, List<string>? Tags, string? AssignedUserId);
    public record CommentBody(string Content, bool NotifyOwner);
    public record ScheduleFromTodoBody(DateTime StartAt, DateTime? EndAt, string? Title, string? TimeZoneId, bool? IsUtc, int? RemindMinutesBefore);
}
