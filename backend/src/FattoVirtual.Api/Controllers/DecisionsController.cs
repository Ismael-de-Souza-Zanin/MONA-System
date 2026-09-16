using FattoVirtual.Domain.Entities;
using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/decisions")]
public class DecisionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public DecisionsController(AppDbContext db) => _db = db;

    [HttpGet]
    [RequirePermission(Permissions.AgendaRead)]
    public async Task<IActionResult> List(
        [FromQuery] Guid? clientId,
        [FromQuery] Guid? eventId,
        [FromQuery] bool? openOnly)
    {
        var orgId = User.GetOrganizationId();
        var q = _db.BusinessDecisions.Include(d => d.Client).Include(d => d.AgendaEvent)
            .Where(d => d.OrganizationId == orgId);
        if (clientId is Guid cid) q = q.Where(d => d.ClientId == cid);
        if (eventId is Guid eid) q = q.Where(d => d.AgendaEventId == eid);
        if (openOnly == true) q = q.Where(d => d.IsOpen);
        if (!User.IsOwner())
        {
            var allowed = User.GetAssignedClientIds();
            q = q.Where(d => d.ClientId == null || allowed.Contains(d.ClientId.Value));
        }

        var items = await q.OrderByDescending(d => d.CreatedAt).Take(200).ToListAsync();
        return Ok(items.Select(Map));
    }

    [HttpPost]
    [RequirePermission(Permissions.AgendaWrite)]
    public async Task<IActionResult> Create([FromBody] DecisionBody body)
    {
        if (string.IsNullOrWhiteSpace(body.Title))
            return BadRequest(new { detail = "Informe a decisão." });

        Guid? clientId = body.ClientId;
        if (body.AgendaEventId is Guid eid)
        {
            var ev = await _db.AgendaEvents.FirstOrDefaultAsync(e =>
                e.Id == eid && e.OrganizationId == User.GetOrganizationId());
            if (ev is null) return BadRequest(new { detail = "Reunião inválida." });
            clientId ??= ev.ClientId;
        }

        if (clientId is Guid cid)
        {
            var ok = await ClientScope.Query(_db, User).AnyAsync(c => c.Id == cid);
            if (!ok) return BadRequest(new { detail = "Cliente inválido." });
        }

        var d = new BusinessDecision
        {
            OrganizationId = User.GetOrganizationId(),
            Title = body.Title.Trim(),
            Body = string.IsNullOrWhiteSpace(body.Body) ? null : body.Body.Trim(),
            ClientId = clientId,
            AgendaEventId = body.AgendaEventId,
            OwnerUserId = body.OwnerUserId ?? User.GetUserId(),
            OwnerName = body.OwnerName,
            DueAtUtc = body.DueAtUtc,
            VisibleToClient = body.VisibleToClient ?? false,
            CreatedByUserId = User.GetUserId()
        };
        _db.BusinessDecisions.Add(d);

        if (body.CreateTodo == true && User.HasPermission(Permissions.TodosWrite))
        {
            var todo = new TodoItem
            {
                OrganizationId = User.GetOrganizationId(),
                Title = d.Title,
                Description = d.Body,
                ClientId = d.ClientId,
                AgendaEventId = d.AgendaEventId,
                AssignedUserId = d.OwnerUserId,
                CreatedByUserId = User.GetUserId(),
                DueAtUtc = d.DueAtUtc,
                Status = TodoStatus.Todo,
                Scope = TodoScope.Personal
            };
            _db.TodoItems.Add(todo);
            d.TodoItem = todo;
        }

        await _db.SaveChangesAsync();
        if (d.TodoItem is not null)
        {
            d.TodoItemId = d.TodoItem.Id;
            await _db.SaveChangesAsync();
        }

        await _db.Entry(d).Reference(x => x.Client).LoadAsync();
        return Ok(Map(d));
    }

    [HttpPatch("{id:guid}")]
    [RequirePermission(Permissions.AgendaWrite)]
    public async Task<IActionResult> Patch(Guid id, [FromBody] PatchDecisionBody body)
    {
        var d = await _db.BusinessDecisions.Include(x => x.Client)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == User.GetOrganizationId());
        if (d is null) return NotFound();
        if (body.IsOpen is bool open) d.IsOpen = open;
        if (body.VisibleToClient is bool vis) d.VisibleToClient = vis;
        if (body.Title is not null) d.Title = body.Title.Trim();
        d.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(Map(d));
    }

    private static object Map(BusinessDecision d) => new
    {
        id = d.Id,
        title = d.Title,
        body = d.Body,
        clientId = d.ClientId,
        clientName = d.Client?.Name,
        agendaEventId = d.AgendaEventId,
        ownerUserId = d.OwnerUserId,
        ownerName = d.OwnerName,
        dueAtUtc = d.DueAtUtc,
        visibleToClient = d.VisibleToClient,
        isOpen = d.IsOpen,
        todoItemId = d.TodoItemId,
        createdAt = d.CreatedAt
    };

    public record DecisionBody(
        string Title,
        string? Body,
        Guid? ClientId,
        Guid? AgendaEventId,
        string? OwnerUserId,
        string? OwnerName,
        DateTime? DueAtUtc,
        bool? VisibleToClient,
        bool? CreateTodo);

    public record PatchDecisionBody(bool? IsOpen, bool? VisibleToClient, string? Title);
}
