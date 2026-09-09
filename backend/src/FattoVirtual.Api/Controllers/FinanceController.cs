using FattoVirtual.Api.Services;
using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Identity;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1")]
public class FinanceController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _users;
    private readonly IWebHostEnvironment _env;

    public FinanceController(AppDbContext db, UserManager<AppUser> users, IWebHostEnvironment env)
    {
        _db = db;
        _users = users;
        _env = env;
    }

    [HttpGet("payments")]
    public async Task<IActionResult> List(
        [FromQuery] string? scope,
        [FromQuery] string? linkedKind,
        [FromQuery] Guid? linkedId)
    {
        if (!User.HasPermission(Permissions.FinanceOwn) && !User.HasPermission(Permissions.FinanceAll))
            return StatusCode(403, new { detail = "Sem permissão." });

        var q = _db.Payments.Include(p => p.Client).Include(p => p.Links)
            .Where(p => p.OrganizationId == User.GetOrganizationId());

        if (!User.HasPermission(Permissions.FinanceAll) || scope == "own")
            q = q.Where(p => p.TargetUserId == User.GetUserId() || (p.TargetUserId == null && User.IsOwner()));

        if (!string.IsNullOrWhiteSpace(linkedKind) && linkedId is Guid lid)
        {
            var kind = linkedKind.Trim().ToLowerInvariant();
            q = q.Where(p => p.Links.Any(l => l.EntityKind == kind && l.EntityId == lid));
        }

        var items = await q.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(items.Select(MapPayment));
    }

    [HttpGet("payments/mine")]
    [RequirePermission(Permissions.FinanceOwn)]
    public async Task<IActionResult> Mine()
    {
        var uid = User.GetUserId();
        var items = await _db.Payments.Include(p => p.Client).Include(p => p.Links)
            .Where(p => p.OrganizationId == User.GetOrganizationId() &&
                        (p.TargetUserId == uid || (User.IsOwner() && p.TargetUserId == null)))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(items.Select(MapPayment));
    }

    private static object MapPayment(Domain.Entities.Payment p) => new
    {
        id = p.Id,
        amount = p.Amount,
        description = p.Description,
        paidAt = p.PaidAt,
        dueDate = p.DueAt,
        ledger = string.IsNullOrWhiteSpace(p.Ledger) ? "Agency" : p.Ledger,
        counterpartyName = p.CounterpartyName,
        category = p.Category,
        clientId = p.ClientId,
        clientName = p.Client?.Name,
        employeeId = p.EmployeeId,
        status = p.IsSettled ? "Paid" : "Pending",
        settleMethod = p.SettleMethod,
        proofFileName = p.ProofFileName,
        hasProof = !string.IsNullOrWhiteSpace(p.ProofStoredName),
        links = (p.Links ?? []).OrderBy(l => l.EntityKind).ThenBy(l => l.Label).Select(l => new
        {
            id = l.Id,
            kind = l.EntityKind,
            entityId = l.EntityId,
            label = l.Label,
            path = l.Path
        })
    };

    [HttpPost("payments")]
    [RequirePermission(Permissions.FinanceAll)]
    public async Task<IActionResult> Create([FromBody] PaymentBody body)
    {
        if (body.Amount <= 0)
            return BadRequest(new { detail = "Informe um valor maior que zero." });

        var ledger = string.IsNullOrWhiteSpace(body.Ledger) ? "Agency" : body.Ledger!.Trim();
        if (ledger is not ("Agency" or "ClientAr" or "ClientAp"))
            return BadRequest(new { detail = "Ledger inválido. Use Agency, ClientAr ou ClientAp." });

        if (body.ClientId is Guid cid)
        {
            var ok = await ClientScope.Query(_db, User).AnyAsync(c => c.Id == cid);
            if (!ok) return BadRequest(new { detail = "Cliente inválido." });
        }

        var dueAt = ToUtc(body.DueAt ?? body.DueDate);
        var paidAt = ToUtc(body.PaidAt) ?? (body.IsSettled == true ? DateTime.UtcNow : null);
        Guid? employeeId = body.EmployeeId is Guid e && e != Guid.Empty ? e : null;
        Guid? invoiceId = body.InvoiceId is Guid inv && inv != Guid.Empty ? inv : null;

        var payment = new Domain.Entities.Payment
        {
            OrganizationId = User.GetOrganizationId(),
            Description = string.IsNullOrWhiteSpace(body.Description) ? "Pagamento" : body.Description!.Trim(),
            Amount = body.Amount,
            ClientId = body.ClientId,
            EmployeeId = employeeId,
            TargetUserId = body.TargetUserId,
            Ledger = ledger,
            CounterpartyName = string.IsNullOrWhiteSpace(body.CounterpartyName) ? null : body.CounterpartyName.Trim(),
            Category = string.IsNullOrWhiteSpace(body.Category) ? null : body.Category.Trim(),
            DueAt = dueAt,
            InvoiceId = invoiceId,
            IsSettled = body.IsSettled ?? false,
            PaidAt = paidAt
        };
        _db.Payments.Add(payment);

        var linkResult = await ApplyLinksAsync(payment, body.Links);
        if (linkResult is IActionResult err) return err;

        await _db.SaveChangesAsync();
        await _db.Entry(payment).Reference(p => p.Client).LoadAsync();
        await _db.Entry(payment).Collection(p => p.Links).LoadAsync();
        return Ok(MapPayment(payment));
    }

    /// <summary>Substitui o conjunto de vínculos do movimento (0..N por tipo).</summary>
    [HttpPut("payments/{id:guid}/links")]
    [RequirePermission(Permissions.FinanceAll)]
    public async Task<IActionResult> SetLinks(Guid id, [FromBody] SetLinksBody body)
    {
        var payment = await _db.Payments.Include(p => p.Links).Include(p => p.Client)
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == User.GetOrganizationId());
        if (payment is null) return NotFound();

        _db.PaymentLinks.RemoveRange(payment.Links);
        payment.Links.Clear();

        var linkResult = await ApplyLinksAsync(payment, body.Links);
        if (linkResult is IActionResult err) return err;

        payment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(MapPayment(payment));
    }

    private async Task<IActionResult?> ApplyLinksAsync(
        Domain.Entities.Payment payment,
        IEnumerable<PaymentLinkBody>? links)
    {
        if (links is null) return null;

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var raw in links)
        {
            if (raw.EntityId == Guid.Empty) continue;
            var kind = (raw.Kind ?? "").Trim().ToLowerInvariant();
            if (!EntityLinkResolver.PaymentLinkKinds.Contains(kind))
                return BadRequest(new { detail = $"Tipo de vínculo inválido: {raw.Kind}. Use todo, agenda, sop, sop-run, service ou contract." });

            var key = $"{kind}:{raw.EntityId:N}";
            if (!seen.Add(key)) continue;

            var resolved = await EntityLinkResolver.ResolveAsync(_db, User, kind, raw.EntityId);
            if (resolved is null)
                return StatusCode(403, new { detail = $"Sem acesso ao vínculo {kind}." });

            payment.Links.Add(new Domain.Entities.PaymentLink
            {
                PaymentId = payment.Id,
                EntityKind = kind,
                EntityId = raw.EntityId,
                Label = resolved.Value.Label,
                Path = resolved.Value.Path
            });
        }

        return null;
    }

    private static DateTime? ToUtc(DateTime? value)
    {
        if (value is null) return null;
        var v = value.Value;
        return v.Kind switch
        {
            DateTimeKind.Utc => v,
            DateTimeKind.Local => v.ToUniversalTime(),
            _ => DateTime.SpecifyKind(v, DateTimeKind.Utc)
        };
    }

    [HttpPost("payments/{id:guid}/settle")]
    [RequirePermission(Permissions.FinanceAll)]
    [RequestSizeLimit(12_000_000)]
    public async Task<IActionResult> Settle(Guid id, IFormFile? proof, [FromForm] string? adminPassword)
    {
        var payment = await _db.Payments.Include(p => p.Links).Include(p => p.Client)
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == User.GetOrganizationId());
        if (payment is null) return NotFound();
        if (payment.IsSettled) return Ok(MapPayment(payment));

        var hasProof = proof is { Length: > 0 };
        var hasPassword = !string.IsNullOrWhiteSpace(adminPassword);
        if (!hasProof && !hasPassword)
            return BadRequest(new { detail = "Envie um comprovante ou informe a senha da Ju/admin." });

        if (hasPassword)
        {
            var ok = await VerifyAdminPasswordAsync(adminPassword!);
            if (!ok) return Unauthorized(new { detail = "Senha da Ju/admin inválida." });
            payment.SettleMethod = "AdminPassword";
        }

        if (hasProof)
        {
            var ext = Path.GetExtension(proof!.FileName);
            if (string.IsNullOrWhiteSpace(ext) || ext.Length > 8) ext = ".bin";
            var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic"
            };
            if (!allowed.Contains(ext))
                return BadRequest(new { detail = "Comprovante: use PDF ou imagem." });

            var dir = Path.Combine(_env.ContentRootPath, "storage", "payments");
            Directory.CreateDirectory(dir);
            var stored = $"{id:N}_{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
            var full = Path.Combine(dir, stored);
            await using (var fs = System.IO.File.Create(full))
                await proof.CopyToAsync(fs);

            payment.ProofFileName = Path.GetFileName(proof.FileName);
            payment.ProofStoredName = stored;
            payment.SettleMethod = hasPassword ? "ProofAndAdminPassword" : "Proof";
        }

        payment.IsSettled = true;
        payment.PaidAt = DateTime.UtcNow;
        payment.SettledByUserId = User.GetUserId();
        payment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(MapPayment(payment));
    }

    [HttpGet("payments/{id:guid}/proof")]
    [RequirePermission(Permissions.FinanceAll)]
    public async Task<IActionResult> GetProof(Guid id)
    {
        var payment = await _db.Payments.FirstOrDefaultAsync(p =>
            p.Id == id && p.OrganizationId == User.GetOrganizationId());
        if (payment is null || string.IsNullOrWhiteSpace(payment.ProofStoredName))
            return NotFound();
        var path = Path.Combine(_env.ContentRootPath, "storage", "payments", payment.ProofStoredName);
        if (!System.IO.File.Exists(path)) return NotFound();
        var contentType = Path.GetExtension(path).ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            _ => "application/octet-stream"
        };
        return PhysicalFile(path, contentType, payment.ProofFileName ?? "comprovante");
    }

    private async Task<bool> VerifyAdminPasswordAsync(string password)
    {
        var orgId = User.GetOrganizationId();
        var ownerTypeIds = await _db.AccessTypes
            .Where(t => t.OrganizationId == orgId && t.IsOwnerType)
            .Select(t => t.Id)
            .ToListAsync();

        var admins = await _users.Users
            .Where(u => u.OrganizationId == orgId &&
                        (u.IsOrganizationOwner ||
                         (u.AccessTypeId != null && ownerTypeIds.Contains(u.AccessTypeId.Value))))
            .ToListAsync();

        foreach (var admin in admins)
        {
            if (await _users.CheckPasswordAsync(admin, password))
                return true;
        }
        return false;
    }

    [HttpGet("finance/active-client-tasks")]
    [RequirePermission(Permissions.FinanceAll)]
    public async Task<IActionResult> ActiveClientTasks()
    {
        var orgId = User.GetOrganizationId();
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var clients = await _db.Clients.Where(c => c.OrganizationId == orgId && c.Status == ClientStatus.Active).ToListAsync();
        var paidClientIds = await _db.Payments
            .Where(p => p.OrganizationId == orgId && p.ClientId != null && p.PaidAt >= monthStart)
            .Select(p => p.ClientId!.Value)
            .Distinct()
            .ToListAsync();

        return Ok(clients.Select(c => new
        {
            clientId = c.Id,
            clientName = c.Name,
            hasPaymentThisMonth = paidClientIds.Contains(c.Id)
        }));
    }

    public record PaymentLinkBody(string Kind, Guid EntityId);

    public record SetLinksBody(List<PaymentLinkBody>? Links);

    public record PaymentBody(
        decimal Amount,
        string? Description,
        Guid? ClientId,
        Guid? EmployeeId,
        string? TargetUserId,
        bool? IsSettled,
        DateTime? PaidAt,
        string? Ledger,
        string? CounterpartyName,
        string? Category,
        DateTime? DueAt,
        DateTime? DueDate,
        Guid? InvoiceId,
        List<PaymentLinkBody>? Links);
}
