using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1")]
public class OnboardingController : ControllerBase
{
    private readonly AppDbContext _db;
    public OnboardingController(AppDbContext db) => _db = db;

    [HttpGet("onboarding/incomplete")]
    [RequirePermission(Permissions.OnboardingRead)]
    public async Task<IActionResult> Incomplete()
    {
        var clients = await ClientScope.Query(_db, User)
            .Include(c => c.OnboardingItems)
            .Where(c => !c.OnboardingCompleted)
            .OrderBy(c => c.Name)
            .ToListAsync();

        return Ok(clients.Select(c => new
        {
            id = c.Id,
            clientId = c.Id,
            clientName = c.Name,
            completedCount = c.OnboardingItems.Count(i => i.IsCompleted),
            totalCount = c.OnboardingItems.Count,
            items = c.OnboardingItems.OrderBy(i => i.SortOrder).Select(i => new
            {
                id = i.Id,
                title = i.Title,
                isCompleted = i.IsCompleted,
                sortOrder = i.SortOrder
            })
        }));
    }

    [HttpPatch("onboarding/{clientId:guid}/items/{itemId:guid}")]
    [RequirePermission(Permissions.OnboardingWrite)]
    public async Task<IActionResult> ToggleItem(Guid clientId, Guid itemId, [FromBody] ToggleBody body)
    {
        var item = await _db.OnboardingItems.Include(i => i.Client)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.ClientId == clientId);
        if (item is null || item.Client.OrganizationId != User.GetOrganizationId()) return NotFound();
        item.IsCompleted = body.IsCompleted;
        item.UpdatedAt = DateTime.UtcNow;

        var all = await _db.OnboardingItems.Where(i => i.ClientId == clientId).ToListAsync();
        item.Client.OnboardingCompleted = all.All(i => i.Id == itemId ? body.IsCompleted : i.IsCompleted);
        await _db.SaveChangesAsync();
        return Ok(new { id = item.Id, title = item.Title, isCompleted = item.IsCompleted, sortOrder = item.SortOrder });
    }

    [HttpPost("onboarding/{clientId:guid}/apply-template")]
    [RequirePermission(Permissions.OnboardingWrite)]
    public async Task<IActionResult> ApplyTemplate(Guid clientId, [FromBody] ApplyTemplateBody body)
    {
        var client = await ClientScope.Query(_db, User).FirstOrDefaultAsync(c => c.Id == clientId);
        if (client is null) return NotFound();
        var template = await _db.ChecklistTemplates.FirstOrDefaultAsync(t =>
            t.Id == body.TemplateId && t.OrganizationId == User.GetOrganizationId());
        if (template is null) return NotFound();

        var order = await _db.OnboardingItems.Where(i => i.ClientId == clientId).CountAsync();
        foreach (var title in template.Items)
        {
            order++;
            _db.OnboardingItems.Add(new Domain.Entities.OnboardingItem
            {
                ClientId = clientId,
                Title = title,
                SortOrder = order
            });
        }
        client.OnboardingCompleted = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("checklist-templates")]
    [RequirePermission(Permissions.OnboardingRead)]
    public async Task<IActionResult> Templates() =>
        Ok(await _db.ChecklistTemplates.Where(t => t.OrganizationId == User.GetOrganizationId())
            .Select(t => new { id = t.Id, name = t.Name, items = t.Items })
            .ToListAsync());

    [HttpPost("checklist-templates")]
    [RequirePermission(Permissions.OnboardingWrite)]
    public async Task<IActionResult> CreateTemplate([FromBody] TemplateBody body)
    {
        var t = new Domain.Entities.ChecklistTemplate
        {
            OrganizationId = User.GetOrganizationId(),
            Name = body.Name,
            Items = body.Items ?? []
        };
        _db.ChecklistTemplates.Add(t);
        await _db.SaveChangesAsync();
        return Ok(new { id = t.Id, name = t.Name, items = t.Items });
    }

    public record ToggleBody(bool IsCompleted);
    public record ApplyTemplateBody(Guid TemplateId);
    public record TemplateBody(string Name, List<string>? Items);
}
