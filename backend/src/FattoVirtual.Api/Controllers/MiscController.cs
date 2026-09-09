using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Route("api/v1")]
public class MiscController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public MiscController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [Authorize]
    [HttpGet("dashboard/stats")]
    [RequirePermission(Permissions.Dashboard)]
    public async Task<IActionResult> Dashboard()
    {
        var orgId = User.GetOrganizationId();
        var uid = User.GetUserId();
        var clients = ClientScope.Query(_db, User);
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var openTodos = await _db.TodoItems.CountAsync(t =>
            t.OrganizationId == orgId && t.Status != TodoStatus.Done &&
            (User.IsOwner() || t.AssignedUserId == uid || t.Scope == TodoScope.General));
        var myAgenda = await _db.AgendaEvents.CountAsync(e =>
            e.OrganizationId == orgId && e.OwnerUserId == uid && e.StartsAt >= today);
        var agendaToday = await _db.AgendaEvents.CountAsync(e =>
            e.OrganizationId == orgId && e.StartsAt >= today && e.StartsAt < tomorrow);
        var pendingPayments = await _db.Payments.CountAsync(p =>
            p.OrganizationId == orgId && !p.IsSettled);

        return Ok(new
        {
            isOwner = User.IsOwner(),
            clients = await clients.CountAsync(),
            activeClients = await clients.CountAsync(c => c.Status == ClientStatus.Active),
            paymentsPending = pendingPayments,
            employees = await _db.Employees.CountAsync(e => e.OrganizationId == orgId),
            partners = await _db.PartnerCompanies.CountAsync(p => p.OrganizationId == orgId),
            services = await _db.ServiceItems.CountAsync(s => s.OrganizationId == orgId),
            contracts = await _db.Contracts.CountAsync(c => c.OrganizationId == orgId),
            onboardingPending = await clients.CountAsync(c => !c.OnboardingCompleted),
            agendaToday,
            myClients = await clients.CountAsync(),
            myTodos = openTodos,
            myAgenda,
            requests = 0,
            sops = await _db.Sops.CountAsync(s => s.OrganizationId == orgId)
        });
    }

    [Authorize]
    [HttpGet("faqs")]
    public async Task<IActionResult> Faqs([FromQuery] bool? publishedOnly)
    {
        var orgId = User.GetOrganizationId();
        var q = _db.FaqItems.Where(f => f.OrganizationId == orgId);
        // Sem Faqs.Write: só publicados. Admin vê rascunhos também (a menos que publishedOnly=true).
        var onlyPublished = publishedOnly ?? (!User.HasPermission(Permissions.FaqsWrite) && !User.IsOwner());
        if (onlyPublished) q = q.Where(f => f.IsPublished);

        var items = await q.OrderBy(f => f.SortOrder).ThenBy(f => f.Question).ToListAsync();
        return Ok(items.Select(f => new
        {
            id = f.Id,
            question = f.Question,
            answer = f.Answer,
            sortOrder = f.SortOrder,
            category = f.Category,
            isPublished = f.IsPublished
        }));
    }

    [Authorize]
    [HttpPost("faqs")]
    [RequirePermission(Permissions.FaqsWrite)]
    public async Task<IActionResult> CreateFaq([FromBody] FaqBody body)
    {
        var orgId = User.GetOrganizationId();
        var max = await _db.FaqItems.Where(f => f.OrganizationId == orgId).Select(f => (int?)f.SortOrder).MaxAsync() ?? 0;
        var e = new Domain.Entities.FaqItem
        {
            OrganizationId = orgId,
            Question = body.Question.Trim(),
            Answer = body.Answer.Trim(),
            Category = string.IsNullOrWhiteSpace(body.Category) ? null : body.Category.Trim(),
            IsPublished = body.IsPublished ?? true,
            SortOrder = body.SortOrder ?? (max + 1)
        };
        _db.FaqItems.Add(e);
        await _db.SaveChangesAsync();
        return Ok(new { id = e.Id, question = e.Question, answer = e.Answer, sortOrder = e.SortOrder, category = e.Category, isPublished = e.IsPublished });
    }

    [Authorize]
    [HttpPut("faqs/{id:guid}")]
    [RequirePermission(Permissions.FaqsWrite)]
    public async Task<IActionResult> UpdateFaq(Guid id, [FromBody] FaqBody body)
    {
        var e = await _db.FaqItems.FirstOrDefaultAsync(f => f.Id == id && f.OrganizationId == User.GetOrganizationId());
        if (e is null) return NotFound();
        e.Question = body.Question.Trim();
        e.Answer = body.Answer.Trim();
        e.Category = string.IsNullOrWhiteSpace(body.Category) ? null : body.Category.Trim();
        if (body.IsPublished.HasValue) e.IsPublished = body.IsPublished.Value;
        if (body.SortOrder.HasValue) e.SortOrder = body.SortOrder.Value;
        e.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { id = e.Id, question = e.Question, answer = e.Answer, sortOrder = e.SortOrder, category = e.Category, isPublished = e.IsPublished });
    }

    [Authorize]
    [HttpDelete("faqs/{id:guid}")]
    [RequirePermission(Permissions.FaqsWrite)]
    public async Task<IActionResult> DeleteFaq(Guid id)
    {
        var e = await _db.FaqItems.FirstOrDefaultAsync(f => f.Id == id && f.OrganizationId == User.GetOrganizationId());
        if (e is null) return NotFound();
        _db.FaqItems.Remove(e);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize]
    [HttpPut("faqs/reorder")]
    [RequirePermission(Permissions.FaqsWrite)]
    public async Task<IActionResult> ReorderFaqs([FromBody] List<FaqReorderItem> items)
    {
        var orgId = User.GetOrganizationId();
        var ids = items.Select(i => i.Id).ToList();
        var faqs = await _db.FaqItems.Where(f => f.OrganizationId == orgId && ids.Contains(f.Id)).ToListAsync();
        foreach (var item in items)
        {
            var f = faqs.FirstOrDefault(x => x.Id == item.Id);
            if (f is null) continue;
            f.SortOrder = item.SortOrder;
            f.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    public record FaqBody(string Question, string Answer, string? Category, bool? IsPublished, int? SortOrder);
    public record FaqReorderItem(Guid Id, int SortOrder);

    private static readonly HashSet<string> PortalScopes = new(StringComparer.OrdinalIgnoreCase)
    {
        "portal", "client", "finance", "contracts", "agenda"
    };

    [Authorize]
    [HttpGet("share-links")]
    [RequirePermission(Permissions.ShareLinks)]
    public async Task<IActionResult> ShareLinks()
    {
        var items = await _db.ShareLinks.Include(s => s.Client)
            .Where(s => s.OrganizationId == User.GetOrganizationId())
            .OrderByDescending(s => s.CreatedAt)
            .Take(200)
            .ToListAsync();
        return Ok(items.Select(MapShareLink));
    }

    [Authorize]
    [HttpPost("share-links")]
    [RequirePermission(Permissions.ShareLinks)]
    public async Task<IActionResult> CreateShareLink([FromBody] ShareBody body)
    {
        var scope = (body.Scope ?? body.Tab ?? "portal").Trim().ToLowerInvariant();
        if (!PortalScopes.Contains(scope))
            return BadRequest(new { detail = "Escopo inválido. Use portal, client, finance, contracts ou agenda." });

        if (body.ClientId is null)
            return BadRequest(new { detail = "Selecione o cliente para o link do contratante." });
        var ok = await ClientScope.Query(_db, User).AnyAsync(c => c.Id == body.ClientId);
        if (!ok) return BadRequest(new { detail = "Cliente inválido ou fora do seu escopo." });

        // Finance exige validade; demais: 90 dias se omitido
        DateTime? expires = body.ExpiresAt;
        if (expires is null)
            expires = DateTime.UtcNow.AddDays(scope == "finance" ? 30 : 90);
        else if (expires.Value.Kind == DateTimeKind.Unspecified)
            expires = DateTime.SpecifyKind(expires.Value, DateTimeKind.Utc);

        var allowMessages = body.AllowMessages ?? scope is "portal" or "client";
        var allowUploads = body.AllowUploads ?? scope is "portal" or "client" or "finance";
        var shareContact = body.ShareContactInfo ?? false;

        var link = new Domain.Entities.ShareLink
        {
            OrganizationId = User.GetOrganizationId(),
            Tab = scope,
            ClientId = body.ClientId,
            ExpiresAt = expires,
            IsActive = true,
            AllowMessages = allowMessages,
            AllowUploads = allowUploads,
            ShareContactInfo = shareContact
        };
        _db.ShareLinks.Add(link);
        await _db.SaveChangesAsync();
        await _db.Entry(link).Reference(l => l.Client).LoadAsync();
        return Ok(MapShareLink(link));
    }

    [Authorize]
    [HttpPatch("share-links/{id:guid}")]
    [RequirePermission(Permissions.ShareLinks)]
    public async Task<IActionResult> UpdateShareLink(Guid id, [FromBody] SharePatchBody body)
    {
        var link = await _db.ShareLinks.Include(s => s.Client)
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == User.GetOrganizationId());
        if (link is null) return NotFound();

        if (link.ClientId is Guid cid)
        {
            var ok = await ClientScope.Query(_db, User).AnyAsync(c => c.Id == cid);
            if (!ok) return StatusCode(403, new { detail = "Sem acesso a este cliente." });
        }

        if (body.IsActive is bool active) link.IsActive = active;
        if (body.AllowMessages is bool am) link.AllowMessages = am;
        if (body.AllowUploads is bool au) link.AllowUploads = au;
        if (body.ShareContactInfo is bool sc) link.ShareContactInfo = sc;
        if (body.ExpiresAt is DateTime exp)
            link.ExpiresAt = exp.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(exp, DateTimeKind.Utc)
                : exp.ToUniversalTime();

        link.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(MapShareLink(link));
    }

    private static object MapShareLink(Domain.Entities.ShareLink s) => new
    {
        id = s.Id,
        token = s.Token,
        scope = s.Tab,
        clientId = s.ClientId,
        clientName = s.Client?.Name,
        createdAt = s.CreatedAt,
        expiresAt = s.ExpiresAt,
        isActive = s.IsActive,
        allowMessages = s.AllowMessages,
        allowUploads = s.AllowUploads,
        shareContactInfo = s.ShareContactInfo,
        expired = s.ExpiresAt is not null && s.ExpiresAt < DateTime.UtcNow
    };

    public record ShareBody(
        string? Scope,
        string? Tab,
        Guid? ClientId,
        DateTime? ExpiresAt,
        bool? AllowMessages,
        bool? AllowUploads,
        bool? ShareContactInfo);

    public record SharePatchBody(
        bool? IsActive,
        bool? AllowMessages,
        bool? AllowUploads,
        bool? ShareContactInfo,
        DateTime? ExpiresAt);
}
