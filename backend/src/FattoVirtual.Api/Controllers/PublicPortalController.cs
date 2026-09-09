using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

/// <summary>
/// Portal do contratante via link (/s/:token) — simples, sem login pesado.
/// Escopos: portal | client | finance | contracts | agenda
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/v1/public")]
public class PublicPortalController : ControllerBase
{
    private static readonly HashSet<string> AllowedExt = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic", ".doc", ".docx"
    };

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public PublicPortalController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet("share/{token}")]
    public async Task<IActionResult> Get(string token)
    {
        var share = await _db.ShareLinks.Include(s => s.Client)
            .FirstOrDefaultAsync(s => s.Token == token && s.IsActive);
        if (share is null) return NotFound(new { detail = "Link inválido." });
        if (share.ExpiresAt is not null && share.ExpiresAt < DateTime.UtcNow)
            return BadRequest(new { detail = "Link expirado." });

        var scope = string.IsNullOrWhiteSpace(share.Tab) ? "portal" : share.Tab.ToLowerInvariant();
        var isPortal = scope is "portal" or "client";
        var client = share.Client;

        object? clientPayload = null;
        object? finance = null;
        object? contracts = null;
        object? agenda = null;
        object? documents = null;
        object? messages = null;

        if (client is not null)
        {
            clientPayload = new
            {
                name = client.Name,
                companyName = client.CompanyName,
                phone = share.ShareContactInfo ? client.Phone : null,
                email = share.ShareContactInfo ? client.Email : null,
                status = client.Status.ToString(),
                nextAction = isPortal ? client.NextAction : null,
                nextActionAtUtc = isPortal ? client.NextActionAtUtc : null,
                relationshipStage = isPortal ? client.RelationshipStage : null
            };

            if (scope is "portal" or "finance")
            {
                var payments = await _db.Payments
                    .Where(p => p.ClientId == client.Id && p.OrganizationId == share.OrganizationId && p.Ledger == "Agency")
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(12)
                    .ToListAsync();
                finance = new
                {
                    pendingTotal = payments.Where(p => !p.IsSettled).Sum(p => p.Amount),
                    paidTotal = payments.Where(p => p.IsSettled).Sum(p => p.Amount),
                    items = payments.Select(p => new
                    {
                        description = p.Description,
                        amount = p.Amount,
                        status = p.IsSettled ? "Pago" : "Pendente",
                        dueDate = p.DueAt,
                        paidAt = p.PaidAt
                    })
                };
            }

            if (scope is "portal" or "contracts")
            {
                contracts = await _db.Contracts
                    .Where(c => c.ClientId == client.Id && c.OrganizationId == share.OrganizationId)
                    .OrderByDescending(c => c.CreatedAt)
                    .Take(20)
                    .Select(c => new { c.Name, c.Status, hasPdf = c.PdfPath != null })
                    .ToListAsync();
            }

            if (scope is "portal" or "agenda")
            {
                var from = DateTime.UtcNow.AddDays(-1);
                agenda = await _db.AgendaEvents
                    .Where(e => e.ClientId == client.Id && e.OrganizationId == share.OrganizationId && e.StartsAt >= from)
                    .OrderBy(e => e.StartsAt)
                    .Take(15)
                    .Select(e => new { e.Title, startAt = e.StartsAt, endAt = e.EndsAt })
                    .ToListAsync();
            }

            if (scope is "portal" or "client" or "finance")
            {
                documents = await _db.ClientDocuments
                    .Where(d => d.ClientId == client.Id && d.OrganizationId == share.OrganizationId)
                    .OrderByDescending(d => d.CreatedAt)
                    .Take(40)
                    .Select(d => new
                    {
                        id = d.Id,
                        title = d.Title,
                        fileName = d.FileName,
                        kind = d.Kind,
                        uploadedBy = d.UploadedBy,
                        uploaderLabel = d.UploaderLabel,
                        createdAt = d.CreatedAt,
                        contentType = d.ContentType
                    })
                    .ToListAsync();

                messages = await _db.ClientPortalMessages
                    .Where(m => m.ClientId == client.Id && m.OrganizationId == share.OrganizationId)
                    .OrderBy(m => m.CreatedAt)
                    .Take(80)
                    .Select(m => new
                    {
                        id = m.Id,
                        body = m.Body,
                        fromContractor = m.FromContractor,
                        authorLabel = m.AuthorLabel,
                        createdAt = m.CreatedAt
                    })
                    .ToListAsync();
            }
        }

        var faqs = await _db.FaqItems.Where(f => f.OrganizationId == share.OrganizationId && f.IsPublished)
            .OrderBy(f => f.SortOrder)
            .Select(f => new { f.Question, f.Answer, f.Category })
            .Take(20)
            .ToListAsync();

        return Ok(new
        {
            scope,
            brand = "Fatto Virtual",
            client = clientPayload,
            finance,
            contracts,
            agenda,
            documents,
            messages,
            faqs,
            capabilities = new
            {
                canMessage = client is not null && share.AllowMessages && (scope is "portal" or "client"),
                canUpload = client is not null && share.AllowUploads && (scope is "portal" or "client" or "finance"),
                canViewFinance = finance is not null,
                canViewContracts = contracts is not null,
                canViewAgenda = agenda is not null,
                shareContactInfo = share.ShareContactInfo
            },
            readOnly = !share.AllowMessages && !share.AllowUploads
        });
    }

    [HttpPost("share/{token}/messages")]
    public async Task<IActionResult> PostMessage(string token, [FromBody] PortalMessageBody body)
    {
        var share = await ValidShareAsync(token);
        if (share is null) return NotFound(new { detail = "Link inválido." });
        if (share.ClientId is null) return BadRequest(new { detail = "Este link não está ligado a um cliente." });
        var scope = (share.Tab ?? "portal").ToLowerInvariant();
        if (scope is not ("portal" or "client") || !share.AllowMessages)
            return StatusCode(403, new { detail = "Este link não permite mensagens." });
        if (string.IsNullOrWhiteSpace(body.Body))
            return BadRequest(new { detail = "Escreva uma mensagem." });

        var msg = new Domain.Entities.ClientPortalMessage
        {
            OrganizationId = share.OrganizationId,
            ClientId = share.ClientId.Value,
            ShareLinkId = share.Id,
            Body = body.Body.Trim(),
            FromContractor = true,
            AuthorLabel = string.IsNullOrWhiteSpace(body.AuthorName) ? "Cliente" : body.AuthorName!.Trim(),
            IsReadByStaff = false
        };
        _db.ClientPortalMessages.Add(msg);

        // Notifica owner / assistentes com ClientsRead — owner da org
        var owner = await _db.Users.FirstOrDefaultAsync(u =>
            u.OrganizationId == share.OrganizationId && u.IsOrganizationOwner);
        if (owner is not null)
        {
            _db.AppNotifications.Add(new Domain.Entities.AppNotification
            {
                OrganizationId = share.OrganizationId,
                UserId = owner.Id,
                Title = "Mensagem do contratante",
                Body = msg.Body.Length > 100 ? msg.Body[..100] + "…" : msg.Body,
                Link = $"/clientes/{share.ClientId}",
                Type = "portal",
                OccursAtUtc = DateTime.UtcNow,
                Priority = "High"
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new
        {
            id = msg.Id,
            body = msg.Body,
            fromContractor = true,
            authorLabel = msg.AuthorLabel,
            createdAt = msg.CreatedAt
        });
    }

    [HttpPost("share/{token}/documents")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UploadDocument(
        string token,
        IFormFile file,
        [FromForm] string? title,
        [FromForm] string? kind,
        [FromForm] string? uploaderLabel)
    {
        var share = await ValidShareAsync(token);
        if (share is null) return NotFound(new { detail = "Link inválido." });
        if (share.ClientId is null) return BadRequest(new { detail = "Este link não está ligado a um cliente." });
        var scope = (share.Tab ?? "portal").ToLowerInvariant();
        if (scope is not ("portal" or "client" or "finance") || !share.AllowUploads)
            return StatusCode(403, new { detail = "Este link não permite envio de arquivos." });
        if (file is null || file.Length == 0)
            return BadRequest(new { detail = "Envie um arquivo ou foto." });

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext) || !AllowedExt.Contains(ext))
            return BadRequest(new { detail = "Use PDF, imagem ou DOC." });

        var dir = Path.Combine(_env.ContentRootPath, "storage", "client-docs", share.ClientId.Value.ToString("N"));
        Directory.CreateDirectory(dir);
        var stored = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var full = Path.Combine(dir, stored);
        await using (var fs = System.IO.File.Create(full))
            await file.CopyToAsync(fs);

        var doc = new Domain.Entities.ClientDocument
        {
            OrganizationId = share.OrganizationId,
            ClientId = share.ClientId.Value,
            ShareLinkId = share.Id,
            Title = string.IsNullOrWhiteSpace(title) ? Path.GetFileNameWithoutExtension(file.FileName) : title!.Trim(),
            FileName = Path.GetFileName(file.FileName),
            StoredName = stored,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            SizeBytes = file.Length,
            Kind = string.IsNullOrWhiteSpace(kind) ? GuessKind(ext, file.ContentType) : kind!,
            UploadedBy = "Contractor",
            UploaderLabel = string.IsNullOrWhiteSpace(uploaderLabel) ? "Cliente" : uploaderLabel
        };
        _db.ClientDocuments.Add(doc);

        var owner = await _db.Users.FirstOrDefaultAsync(u =>
            u.OrganizationId == share.OrganizationId && u.IsOrganizationOwner);
        if (owner is not null)
        {
            _db.AppNotifications.Add(new Domain.Entities.AppNotification
            {
                OrganizationId = share.OrganizationId,
                UserId = owner.Id,
                Title = "Documento do contratante",
                Body = $"{doc.Title} ({doc.Kind})",
                Link = $"/clientes/{share.ClientId}",
                Type = "portal_doc",
                OccursAtUtc = DateTime.UtcNow,
                Priority = "Normal"
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new
        {
            id = doc.Id,
            title = doc.Title,
            fileName = doc.FileName,
            kind = doc.Kind,
            uploadedBy = doc.UploadedBy,
            createdAt = doc.CreatedAt
        });
    }

    [HttpGet("share/{token}/documents/{docId:guid}")]
    public async Task<IActionResult> DownloadDocument(string token, Guid docId)
    {
        var share = await ValidShareAsync(token);
        if (share is null || share.ClientId is null) return NotFound();
        var scope = (share.Tab ?? "portal").ToLowerInvariant();
        if (scope is not ("portal" or "client" or "finance"))
            return StatusCode(403, new { detail = "Este link não permite baixar documentos." });
        var doc = await _db.ClientDocuments.FirstOrDefaultAsync(d =>
            d.Id == docId && d.ClientId == share.ClientId && d.OrganizationId == share.OrganizationId);
        if (doc is null) return NotFound();
        var path = Path.Combine(_env.ContentRootPath, "storage", "client-docs",
            share.ClientId.Value.ToString("N"), doc.StoredName);
        if (!System.IO.File.Exists(path)) return NotFound();
        return PhysicalFile(path, doc.ContentType, doc.FileName);
    }

    private async Task<Domain.Entities.ShareLink?> ValidShareAsync(string token)
    {
        var share = await _db.ShareLinks.FirstOrDefaultAsync(s => s.Token == token && s.IsActive);
        if (share is null) return null;
        if (share.ExpiresAt is not null && share.ExpiresAt < DateTime.UtcNow) return null;
        return share;
    }

    private static string GuessKind(string ext, string? contentType)
    {
        if (contentType?.StartsWith("image/", StringComparison.OrdinalIgnoreCase) == true) return "Photo";
        if (ext.Equals(".pdf", StringComparison.OrdinalIgnoreCase)) return "Proof";
        return "Document";
    }

    public record PortalMessageBody(string Body, string? AuthorName);
}
