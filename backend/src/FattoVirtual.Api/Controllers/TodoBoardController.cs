using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/todo-board")]
public class TodoBoardController : ControllerBase
{
    private readonly AppDbContext _db;
    public TodoBoardController(AppDbContext db) => _db = db;

    [HttpGet("columns")]
    [RequirePermission(Permissions.TodosRead)]
    public async Task<IActionResult> ListColumns()
    {
        var orgId = User.GetOrganizationId();
        await EnsureDefaultsAsync(orgId);
        var cols = await _db.TodoBoardColumns
            .Where(c => c.OrganizationId == orgId)
            .OrderBy(c => c.SortOrder)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                color = c.Color,
                sortOrder = c.SortOrder,
                marksComplete = c.MarksComplete,
                count = c.Todos.Count
            })
            .ToListAsync();
        return Ok(cols);
    }

    [HttpPost("columns")]
    [RequirePermission(Permissions.TodosWrite)]
    public async Task<IActionResult> CreateColumn([FromBody] ColumnBody body)
    {
        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest(new { detail = "Nome obrigatório." });
        var orgId = User.GetOrganizationId();
        await EnsureDefaultsAsync(orgId);
        var max = await _db.TodoBoardColumns.Where(c => c.OrganizationId == orgId).MaxAsync(c => (int?)c.SortOrder) ?? 0;
        var col = new Domain.Entities.TodoBoardColumn
        {
            OrganizationId = orgId,
            Name = body.Name.Trim(),
            Color = string.IsNullOrWhiteSpace(body.Color) ? "#006D69" : body.Color!,
            SortOrder = max + 1,
            MarksComplete = body.MarksComplete == true
        };
        _db.TodoBoardColumns.Add(col);
        await _db.SaveChangesAsync();
        return Ok(new { id = col.Id, name = col.Name, color = col.Color, sortOrder = col.SortOrder, marksComplete = col.MarksComplete });
    }

    [HttpPut("columns/{id:guid}")]
    [RequirePermission(Permissions.TodosWrite)]
    public async Task<IActionResult> UpdateColumn(Guid id, [FromBody] ColumnBody body)
    {
        var col = await _db.TodoBoardColumns.FirstOrDefaultAsync(c =>
            c.Id == id && c.OrganizationId == User.GetOrganizationId());
        if (col is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(body.Name)) col.Name = body.Name.Trim();
        if (!string.IsNullOrWhiteSpace(body.Color)) col.Color = body.Color!;
        if (body.MarksComplete.HasValue) col.MarksComplete = body.MarksComplete.Value;
        if (body.SortOrder.HasValue) col.SortOrder = body.SortOrder.Value;
        col.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { id = col.Id, name = col.Name, color = col.Color, sortOrder = col.SortOrder, marksComplete = col.MarksComplete });
    }

    [HttpPost("columns/reorder")]
    [RequirePermission(Permissions.TodosWrite)]
    public async Task<IActionResult> Reorder([FromBody] ReorderBody body)
    {
        var orgId = User.GetOrganizationId();
        var cols = await _db.TodoBoardColumns.Where(c => c.OrganizationId == orgId).ToListAsync();
        var order = 0;
        foreach (var id in body.Ids ?? [])
        {
            var col = cols.FirstOrDefault(c => c.Id == id);
            if (col is null) continue;
            col.SortOrder = order++;
            col.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    [HttpDelete("columns/{id:guid}")]
    [RequirePermission(Permissions.TodosWrite)]
    public async Task<IActionResult> DeleteColumn(Guid id)
    {
        var orgId = User.GetOrganizationId();
        var col = await _db.TodoBoardColumns.Include(c => c.Todos)
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
        if (col is null) return NotFound();
        var fallback = await _db.TodoBoardColumns
            .Where(c => c.OrganizationId == orgId && c.Id != id)
            .OrderBy(c => c.SortOrder)
            .FirstOrDefaultAsync();
        if (fallback is null)
            return BadRequest(new { detail = "Mantenha ao menos uma coluna." });
        foreach (var t in col.Todos)
        {
            t.BoardColumnId = fallback.Id;
            t.Status = fallback.MarksComplete ? TodoStatus.Done : TodoStatus.Todo;
            t.UpdatedAt = DateTime.UtcNow;
        }
        _db.TodoBoardColumns.Remove(col);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task EnsureDefaultsAsync(Guid orgId)
    {
        if (await _db.TodoBoardColumns.AnyAsync(c => c.OrganizationId == orgId)) return;
        _db.TodoBoardColumns.AddRange(
            new Domain.Entities.TodoBoardColumn { OrganizationId = orgId, Name = "A fazer", Color = "#64748B", SortOrder = 0 },
            new Domain.Entities.TodoBoardColumn { OrganizationId = orgId, Name = "Em progresso", Color = "#0369A1", SortOrder = 1 },
            new Domain.Entities.TodoBoardColumn { OrganizationId = orgId, Name = "Concluída", Color = "#047857", SortOrder = 2, MarksComplete = true }
        );
        await _db.SaveChangesAsync();

        var cols = await _db.TodoBoardColumns.Where(c => c.OrganizationId == orgId).ToListAsync();
        var byStatus = new Dictionary<TodoStatus, Guid>
        {
            [TodoStatus.Todo] = cols.First(c => c.SortOrder == 0).Id,
            [TodoStatus.InProgress] = cols.First(c => c.SortOrder == 1).Id,
            [TodoStatus.Done] = cols.First(c => c.MarksComplete).Id
        };
        var todos = await _db.TodoItems.Where(t => t.OrganizationId == orgId && t.BoardColumnId == null).ToListAsync();
        foreach (var t in todos)
            t.BoardColumnId = byStatus.GetValueOrDefault(t.Status, byStatus[TodoStatus.Todo]);
        await _db.SaveChangesAsync();
    }

    public record ColumnBody(string? Name, string? Color, bool? MarksComplete, int? SortOrder);
    public record ReorderBody(List<Guid>? Ids);
}
