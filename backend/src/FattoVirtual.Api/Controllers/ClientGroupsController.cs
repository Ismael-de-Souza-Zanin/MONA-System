using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

/// <summary>
/// Grupos de clientes definidos pela org/assistentes — organização flexível, sem catálogo de negócio.
/// </summary>
[ApiController]
[Authorize]
[Route("api/v1/client-groups")]
public class ClientGroupsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ClientGroupsController(AppDbContext db) => _db = db;

    [HttpGet]
    [RequirePermission(Permissions.ClientsRead)]
    public async Task<IActionResult> List()
    {
        var orgId = User.GetOrganizationId();
        var groups = await _db.ClientGroups
            .Where(g => g.OrganizationId == orgId)
            .OrderBy(g => g.SortOrder)
            .ThenBy(g => g.Name)
            .Select(g => new
            {
                id = g.Id,
                name = g.Name,
                description = g.Description,
                color = g.Color,
                sortOrder = g.SortOrder,
                clientCount = g.Clients.Count
            })
            .ToListAsync();
        return Ok(groups);
    }

    [HttpPost]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> Create([FromBody] GroupBody body)
    {
        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest(new { detail = "Nome do grupo é obrigatório." });

        var maxOrder = await _db.ClientGroups
            .Where(g => g.OrganizationId == User.GetOrganizationId())
            .Select(g => (int?)g.SortOrder)
            .MaxAsync() ?? 0;

        var g = new Domain.Entities.ClientGroup
        {
            OrganizationId = User.GetOrganizationId(),
            Name = body.Name.Trim(),
            Description = body.Description,
            Color = string.IsNullOrWhiteSpace(body.Color) ? "#006D69" : body.Color!,
            SortOrder = body.SortOrder ?? maxOrder + 1
        };
        _db.ClientGroups.Add(g);
        await _db.SaveChangesAsync();
        return Ok(new { id = g.Id, name = g.Name, description = g.Description, color = g.Color, sortOrder = g.SortOrder, clientCount = 0 });
    }

    [HttpPut("{id:guid}")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> Update(Guid id, [FromBody] GroupBody body)
    {
        var g = await _db.ClientGroups.FirstOrDefaultAsync(x =>
            x.Id == id && x.OrganizationId == User.GetOrganizationId());
        if (g is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(body.Name)) g.Name = body.Name.Trim();
        if (body.Description is not null) g.Description = body.Description;
        if (!string.IsNullOrWhiteSpace(body.Color)) g.Color = body.Color!;
        if (body.SortOrder.HasValue) g.SortOrder = body.SortOrder.Value;
        g.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { id = g.Id, name = g.Name, description = g.Description, color = g.Color, sortOrder = g.SortOrder });
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var g = await _db.ClientGroups.Include(x => x.Clients)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == User.GetOrganizationId());
        if (g is null) return NotFound();
        foreach (var c in g.Clients) c.ClientGroupId = null;
        _db.ClientGroups.Remove(g);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    public record GroupBody(string? Name, string? Description, string? Color, int? SortOrder);
}
