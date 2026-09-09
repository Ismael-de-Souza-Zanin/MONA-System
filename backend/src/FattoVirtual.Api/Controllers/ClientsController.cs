using FattoVirtual.Domain.Entities;
using FattoVirtual.Domain.Enums;
using FattoVirtual.Domain.Rules;
using FattoVirtual.Infrastructure.Persistence;
using FattoVirtual.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/clients")]
public class ClientsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ISecretProtector _protector;

    public ClientsController(AppDbContext db, ISecretProtector protector)
    {
        _db = db;
        _protector = protector;
    }

    [HttpGet]
    [RequirePermission(Permissions.ClientsRead)]
    public async Task<IActionResult> List([FromQuery] string? q)
    {
        IQueryable<Client> query = ClientScope.Query(_db, User).Include(c => c.ClientGroup);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(term) ||
                (c.Phone != null && c.Phone.Contains(term)) ||
                (c.CompanyName != null && c.CompanyName.ToLower().Contains(term)));
        }

        var items = await query.OrderBy(c => c.Name).ToListAsync();
        return Ok(items.Select(MapList));
    }

    [HttpGet("counts")]
    [RequirePermission(Permissions.ClientsRead)]
    public async Task<IActionResult> Counts()
    {
        var query = ClientScope.Query(_db, User);
        return Ok(new
        {
            total = await query.CountAsync(),
            active = await query.CountAsync(c => c.Status == ClientStatus.Active),
            inactive = await query.CountAsync(c => c.Status == ClientStatus.Inactive),
            hold = await query.CountAsync(c => c.Status == ClientStatus.Hold),
            notice = await query.CountAsync(c => c.Status == ClientStatus.Notice)
        });
    }

    [HttpGet("{id:guid}")]
    [RequirePermission(Permissions.ClientsRead)]
    public async Task<IActionResult> Get(Guid id)
    {
        var client = await ClientScope.Query(_db, User)
            .Include(c => c.ClientGroup)
            .Include(c => c.Topics)
            .Include(c => c.Links)
            .Include(c => c.Credentials)
            .Include(c => c.ClientApps)
            .Include(c => c.Invoices)
            .Include(c => c.OnboardingItems)
            .Include(c => c.CrmEntries)
            .Include(c => c.EmployeeLinks).ThenInclude(l => l.Employee)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return NotFound();

        var orgId = User.GetOrganizationId();
        var payments = await _db.Payments
            .Include(p => p.Links)
            .Where(p => p.OrganizationId == orgId && p.ClientId == id)
            .OrderByDescending(p => p.CreatedAt)
            .Take(120)
            .ToListAsync();
        var contracts = await _db.Contracts
            .Where(c => c.OrganizationId == orgId && c.ClientId == id)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
        var todos = await _db.TodoItems
            .Where(t => t.OrganizationId == orgId && t.ClientId == id)
            .OrderByDescending(t => t.CreatedAt)
            .Take(30)
            .ToListAsync();
        var events = await _db.AgendaEvents
            .Where(e => e.OrganizationId == orgId && e.ClientId == id)
            .OrderByDescending(e => e.StartsAt)
            .Take(20)
            .ToListAsync();

        return Ok(MapDetail(client, payments, contracts, todos, events));
    }

    [HttpPost]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> Create([FromBody] UpsertClientBody body)
    {
        var client = new Domain.Entities.Client
        {
            OrganizationId = User.GetOrganizationId(),
            Name = body.Name,
            Phone = body.Phone,
            CompanyName = body.CompanyName,
            Email = body.Email,
            CrmNotes = body.CrmNotes ?? body.Crm,
            Segment = body.Segment,
            ClientGroupId = body.ClientGroupId,
            Tags = body.Tags ?? body.ServiceScopes ?? [],
            PreferredLanguage = body.PreferredLanguage ?? "pt-BR",
            MarketCountry = body.MarketCountry,
            Document = body.Document,
            Address = body.Address,
            FinanceNotes = body.FinanceNotes,
            ContractNotes = body.ContractNotes,
            ServiceWorkNotes = body.ServiceWorkNotes,
            AdditionalNotes = body.AdditionalNotes,
            ContractCode = body.ContractCode,
            ContractRenewalDate = body.ContractRenewalDate,
            TimeZoneId = body.TimeZoneId ?? "America/Sao_Paulo",
            NeedsQuickResponse = body.NeedsQuickResponse ?? false,
            Status = ClientStatus.Active,
            OnboardingCompleted = false
        };
        _db.Clients.Add(client);
        _db.OnboardingItems.Add(new Domain.Entities.OnboardingItem
        {
            ClientId = client.Id,
            Title = "Boas-vindas e alinhamento inicial",
            SortOrder = 1
        });
        await _db.SaveChangesAsync();
        return Ok(MapList(client));
    }

    [HttpPut("{id:guid}")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertClientBody body)
    {
        var client = await ClientScope.Query(_db, User).FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return NotFound();
        client.Name = body.Name;
        client.Phone = body.Phone;
        client.CompanyName = body.CompanyName;
        client.Email = body.Email;
        client.CrmNotes = body.CrmNotes ?? body.Crm ?? client.CrmNotes;
        client.Segment = body.Segment ?? client.Segment;
        if (body.ClientGroupId.HasValue)
            client.ClientGroupId = body.ClientGroupId == Guid.Empty ? null : body.ClientGroupId;
        if (body.ClearGroup == true) client.ClientGroupId = null;
        if (body.Tags is not null) client.Tags = body.Tags;
        else if (body.ServiceScopes is not null) client.Tags = body.ServiceScopes;
        if (!string.IsNullOrWhiteSpace(body.PreferredLanguage)) client.PreferredLanguage = body.PreferredLanguage!;
        if (body.MarketCountry is not null) client.MarketCountry = body.MarketCountry;
        if (body.NeedsQuickResponse.HasValue) client.NeedsQuickResponse = body.NeedsQuickResponse.Value;
        client.Document = body.Document ?? client.Document;
        client.Address = body.Address ?? client.Address;
        client.FinanceNotes = body.FinanceNotes ?? client.FinanceNotes;
        client.ContractNotes = body.ContractNotes ?? client.ContractNotes;
        client.ServiceWorkNotes = body.ServiceWorkNotes ?? client.ServiceWorkNotes;
        client.AdditionalNotes = body.AdditionalNotes ?? client.AdditionalNotes;
        client.ContractCode = body.ContractCode ?? client.ContractCode;
        if (body.ContractRenewalDate.HasValue) client.ContractRenewalDate = body.ContractRenewalDate;
        if (!string.IsNullOrWhiteSpace(body.TimeZoneId)) client.TimeZoneId = body.TimeZoneId!;
        client.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(MapList(client));
    }

    [HttpPatch("{id:guid}/notes")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> PatchNotes(Guid id, [FromBody] NotesBody body)
    {
        var client = await ClientScope.Query(_db, User).FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return NotFound();
        if (body.Crm is not null) client.CrmNotes = body.Crm;
        if (body.FinanceNotes is not null) client.FinanceNotes = body.FinanceNotes;
        if (body.ContractNotes is not null) client.ContractNotes = body.ContractNotes;
        if (body.ServiceWorkNotes is not null) client.ServiceWorkNotes = body.ServiceWorkNotes;
        if (body.AdditionalNotes is not null) client.AdditionalNotes = body.AdditionalNotes;
        if (body.RelationshipStage is not null) client.RelationshipStage = body.RelationshipStage;
        if (body.NextAction is not null) client.NextAction = body.NextAction;
        if (body.ClearNextAction == true)
        {
            client.NextAction = null;
            client.NextActionAtUtc = null;
        }
        if (body.NextActionAtUtc.HasValue) client.NextActionAtUtc = body.NextActionAtUtc;
        client.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/crm-entries")]
    [RequirePermission(Permissions.ClientsRead)]
    public async Task<IActionResult> CrmEntries(Guid id)
    {
        if (!await ClientScope.Query(_db, User).AnyAsync(c => c.Id == id)) return NotFound();
        var items = await _db.ClientCrmEntries
            .Where(e => e.ClientId == id && e.OrganizationId == User.GetOrganizationId())
            .OrderByDescending(e => e.CreatedAt)
            .Take(80)
            .Select(e => new
            {
                id = e.Id,
                kind = e.Kind,
                summary = e.Summary,
                channel = e.Channel,
                followUpAtUtc = e.FollowUpAtUtc,
                createdByName = e.CreatedByName,
                createdAt = e.CreatedAt
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:guid}/portal-messages")]
    [RequirePermission(Permissions.ClientsRead)]
    public async Task<IActionResult> PortalMessages(Guid id)
    {
        if (!await ClientScope.Query(_db, User).AnyAsync(c => c.Id == id)) return NotFound();
        var items = await _db.ClientPortalMessages
            .Where(m => m.ClientId == id && m.OrganizationId == User.GetOrganizationId())
            .OrderBy(m => m.CreatedAt)
            .Take(100)
            .Select(m => new
            {
                id = m.Id,
                body = m.Body,
                fromContractor = m.FromContractor,
                authorLabel = m.AuthorLabel,
                isReadByStaff = m.IsReadByStaff,
                createdAt = m.CreatedAt
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("{id:guid}/portal-messages")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> ReplyPortal(Guid id, [FromBody] PortalStaffMessageBody body)
    {
        if (!await ClientScope.Query(_db, User).AnyAsync(c => c.Id == id)) return NotFound();
        if (string.IsNullOrWhiteSpace(body.Body)) return BadRequest(new { detail = "Mensagem vazia." });
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == User.GetUserId());
        var msg = new Domain.Entities.ClientPortalMessage
        {
            OrganizationId = User.GetOrganizationId(),
            ClientId = id,
            Body = body.Body.Trim(),
            FromContractor = false,
            AuthorLabel = user?.FullName ?? "Equipe",
            AuthorUserId = User.GetUserId(),
            IsReadByStaff = true
        };
        _db.ClientPortalMessages.Add(msg);
        await _db.SaveChangesAsync();
        return Ok(new
        {
            id = msg.Id,
            body = msg.Body,
            fromContractor = false,
            authorLabel = msg.AuthorLabel,
            createdAt = msg.CreatedAt
        });
    }

    [HttpGet("{id:guid}/documents")]
    [RequirePermission(Permissions.ClientsRead)]
    public async Task<IActionResult> Documents(Guid id)
    {
        if (!await ClientScope.Query(_db, User).AnyAsync(c => c.Id == id)) return NotFound();
        var items = await _db.ClientDocuments
            .Where(d => d.ClientId == id && d.OrganizationId == User.GetOrganizationId())
            .OrderByDescending(d => d.CreatedAt)
            .Take(80)
            .Select(d => new
            {
                id = d.Id,
                title = d.Title,
                fileName = d.FileName,
                kind = d.Kind,
                uploadedBy = d.UploadedBy,
                uploaderLabel = d.UploaderLabel,
                contentType = d.ContentType,
                sizeBytes = d.SizeBytes,
                createdAt = d.CreatedAt
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("{id:guid}/documents")]
    [RequirePermission(Permissions.ClientsWrite)]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UploadDocument(
        Guid id,
        IFormFile file,
        [FromForm] string? title,
        [FromForm] string? kind,
        [FromServices] IWebHostEnvironment env)
    {
        if (!await ClientScope.Query(_db, User).AnyAsync(c => c.Id == id)) return NotFound();
        if (file is null || file.Length == 0) return BadRequest(new { detail = "Arquivo obrigatório." });
        var ext = Path.GetExtension(file.FileName);
        var dir = Path.Combine(env.ContentRootPath, "storage", "client-docs", id.ToString("N"));
        Directory.CreateDirectory(dir);
        var stored = $"{Guid.NewGuid():N}{(string.IsNullOrWhiteSpace(ext) ? ".bin" : ext.ToLowerInvariant())}";
        await using (var fs = System.IO.File.Create(Path.Combine(dir, stored)))
            await file.CopyToAsync(fs);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == User.GetUserId());
        var doc = new Domain.Entities.ClientDocument
        {
            OrganizationId = User.GetOrganizationId(),
            ClientId = id,
            Title = string.IsNullOrWhiteSpace(title) ? Path.GetFileNameWithoutExtension(file.FileName) : title!.Trim(),
            FileName = Path.GetFileName(file.FileName),
            StoredName = stored,
            ContentType = file.ContentType ?? "application/octet-stream",
            SizeBytes = file.Length,
            Kind = string.IsNullOrWhiteSpace(kind) ? "Document" : kind!,
            UploadedBy = "Staff",
            UploaderLabel = user?.FullName,
            UploadedByUserId = User.GetUserId()
        };
        _db.ClientDocuments.Add(doc);
        await _db.SaveChangesAsync();
        return Ok(new { id = doc.Id, title = doc.Title, fileName = doc.FileName, kind = doc.Kind, createdAt = doc.CreatedAt });
    }

    [HttpGet("{id:guid}/documents/{docId:guid}/file")]
    [RequirePermission(Permissions.ClientsRead)]
    public async Task<IActionResult> DownloadDocument(Guid id, Guid docId, [FromServices] IWebHostEnvironment env)
    {
        if (!await ClientScope.Query(_db, User).AnyAsync(c => c.Id == id)) return NotFound();
        var doc = await _db.ClientDocuments.FirstOrDefaultAsync(d =>
            d.Id == docId && d.ClientId == id && d.OrganizationId == User.GetOrganizationId());
        if (doc is null) return NotFound();
        var path = Path.Combine(env.ContentRootPath, "storage", "client-docs", id.ToString("N"), doc.StoredName);
        if (!System.IO.File.Exists(path)) return NotFound();
        return PhysicalFile(path, doc.ContentType, doc.FileName);
    }

    [HttpPost("{id:guid}/crm-entries")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> AddCrmEntry(Guid id, [FromBody] CrmEntryBody body)
    {
        var client = await ClientScope.Query(_db, User).FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return NotFound();
        if (string.IsNullOrWhiteSpace(body.Summary))
            return BadRequest(new { detail = "Informe o registro." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == User.GetUserId());
        var entry = new Domain.Entities.ClientCrmEntry
        {
            OrganizationId = User.GetOrganizationId(),
            ClientId = id,
            Kind = string.IsNullOrWhiteSpace(body.Kind) ? "Note" : body.Kind!,
            Summary = body.Summary.Trim(),
            Channel = body.Channel,
            FollowUpAtUtc = body.FollowUpAtUtc,
            CreatedByUserId = User.GetUserId(),
            CreatedByName = user?.FullName
        };
        _db.ClientCrmEntries.Add(entry);
        client.LastContactAtUtc = DateTime.UtcNow;
        if (body.FollowUpAtUtc.HasValue)
        {
            client.NextActionAtUtc = body.FollowUpAtUtc;
            if (!string.IsNullOrWhiteSpace(body.NextAction))
                client.NextAction = body.NextAction;
            else if (string.IsNullOrWhiteSpace(client.NextAction))
                client.NextAction = "Follow-up do contato";
        }
        else if (!string.IsNullOrWhiteSpace(body.NextAction))
        {
            client.NextAction = body.NextAction;
        }
        client.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new
        {
            id = entry.Id,
            kind = entry.Kind,
            summary = entry.Summary,
            channel = entry.Channel,
            followUpAtUtc = entry.FollowUpAtUtc,
            createdByName = entry.CreatedByName,
            createdAt = entry.CreatedAt
        });
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var client = await ClientScope.Query(_db, User).FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return NotFound();
        _db.Clients.Remove(client);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/pending-todos")]
    [RequirePermission(Permissions.ClientsRead)]
    public async Task<IActionResult> PendingTodos(Guid id)
    {
        var hasPending = await _db.TodoItems.AnyAsync(t =>
            t.OrganizationId == User.GetOrganizationId() &&
            t.ClientId == id &&
            t.Status != TodoStatus.Done);
        return Ok(new { hasPending });
    }

    [HttpPost("{id:guid}/status")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] StatusBody body)
    {
        var client = await ClientScope.Query(_db, User).FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return NotFound();

        if (!Enum.TryParse<ClientStatus>(body.Status ?? body.NewStatus, true, out var next))
            return BadRequest(new { detail = "Status inválido." });

        if (!ClientStatusRules.CanTransition(client.Status, next))
            return BadRequest(new { detail = "Transição de status não permitida." });

        if (ClientStatusRules.RequiresEmailConfirmation(client.Status, next) &&
            !(body.EmailSent ?? body.EmailSentConfirmed ?? false))
            return BadRequest(new { detail = "Confirme o envio do e-mail ao cliente." });

        if (ClientStatusRules.RequiresInactiveChecks(next))
        {
            var hasPending = await _db.TodoItems.AnyAsync(t =>
                t.OrganizationId == User.GetOrganizationId() &&
                t.ClientId == id &&
                t.Status != TodoStatus.Done);
            if (hasPending)
                return BadRequest(new { detail = "Existem tasks pendentes vinculadas a este cliente." });

            if (!(body.PaymentSettled ?? body.PendingPaymentSettled ?? false) ||
                !(body.FinalMessageSent ?? false) ||
                !(body.PendingResolved ?? body.PendenciesResolved ?? false) ||
                !(body.RemovedFromGroup ?? false))
                return BadRequest(new { detail = "Complete todos os checks para inativar." });
        }

        client.Status = next;
        client.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(MapList(client));
    }

    [HttpPost("{id:guid}/topics")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> AddTopic(Guid id, [FromBody] TopicBody body)
    {
        if (!await ClientScope.Query(_db, User).AnyAsync(c => c.Id == id)) return NotFound();
        var topic = new Domain.Entities.ClientTopic
        {
            ClientId = id,
            Title = body.Title,
            Observation = body.Content ?? body.Observation ?? string.Empty
        };
        _db.ClientTopics.Add(topic);
        await _db.SaveChangesAsync();
        return Ok(new { id = topic.Id, clientId = id, title = topic.Title, content = topic.Observation });
    }

    [HttpDelete("{id:guid}/topics/{topicId:guid}")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> DeleteTopic(Guid id, Guid topicId)
    {
        var topic = await _db.ClientTopics.FirstOrDefaultAsync(t => t.Id == topicId && t.ClientId == id);
        if (topic is null) return NotFound();
        _db.ClientTopics.Remove(topic);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/links")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> AddLink(Guid id, [FromBody] LinkBody body)
    {
        if (!await ClientScope.Query(_db, User).AnyAsync(c => c.Id == id)) return NotFound();
        var link = new Domain.Entities.ClientLink { ClientId = id, Label = body.Label, Url = body.Url };
        _db.ClientLinks.Add(link);
        await _db.SaveChangesAsync();
        return Ok(new { id = link.Id, clientId = id, label = link.Label, url = link.Url });
    }

    [HttpPost("{id:guid}/credentials")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> AddCredential(Guid id, [FromBody] CredentialBody body)
    {
        if (!await ClientScope.Query(_db, User).AnyAsync(c => c.Id == id)) return NotFound();
        var cred = new Domain.Entities.ClientCredential
        {
            ClientId = id,
            AppName = body.AppName,
            Login = body.Login,
            EncryptedPassword = _protector.Encrypt(body.Password)
        };
        _db.ClientCredentials.Add(cred);
        await _db.SaveChangesAsync();
        return Ok(new { id = cred.Id, appName = cred.AppName, login = cred.Login, password = body.Password });
    }

    [HttpDelete("{id:guid}/credentials/{credentialId:guid}")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> DeleteCredential(Guid id, Guid credentialId)
    {
        var cred = await _db.ClientCredentials.FirstOrDefaultAsync(c => c.Id == credentialId && c.ClientId == id);
        if (cred is null) return NotFound();
        _db.ClientCredentials.Remove(cred);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/apps")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> AddApp(Guid id, [FromBody] AppBody body)
    {
        if (!await ClientScope.Query(_db, User).AnyAsync(c => c.Id == id)) return NotFound();
        var app = new Domain.Entities.ClientApp
        {
            ClientId = id,
            Name = body.Name,
            AppId = body.AppId
        };
        _db.ClientApps.Add(app);
        await _db.SaveChangesAsync();
        return Ok(new { id = app.Id, name = app.Name, appId = app.AppId });
    }

    [HttpDelete("{id:guid}/apps/{appId:guid}")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> DeleteApp(Guid id, Guid appId)
    {
        var app = await _db.ClientApps.FirstOrDefaultAsync(a => a.Id == appId && a.ClientId == id);
        if (app is null) return NotFound();
        _db.ClientApps.Remove(app);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/invoices")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> AddInvoice(Guid id, [FromBody] InvoiceBody body)
    {
        if (!await ClientScope.Query(_db, User).AnyAsync(c => c.Id == id)) return NotFound();
        var invoice = new Domain.Entities.Invoice
        {
            ClientId = id,
            Reference = body.Reference,
            Amount = body.Amount,
            PeriodStart = body.PeriodStart,
            PeriodEnd = body.PeriodEnd,
            Status = body.Status ?? "Open",
            Kind = string.IsNullOrWhiteSpace(body.Kind) ? "AgencyFee" : body.Kind!,
            CounterpartyName = body.CounterpartyName,
            DueDate = body.DueDate,
            Notes = body.Notes
        };
        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();
        return Ok(new
        {
            id = invoice.Id,
            reference = invoice.Reference,
            amount = invoice.Amount,
            periodStart = invoice.PeriodStart,
            periodEnd = invoice.PeriodEnd,
            status = invoice.Status,
            kind = invoice.Kind,
            counterpartyName = invoice.CounterpartyName,
            dueDate = invoice.DueDate,
            notes = invoice.Notes
        });
    }

    private static object MapList(Domain.Entities.Client c) => new
    {
        id = c.Id,
        name = c.Name,
        phone = c.Phone,
        companyName = c.CompanyName,
        email = c.Email,
        status = c.Status.ToString(),
        crm = c.CrmNotes,
        segment = c.Segment,
        clientGroupId = c.ClientGroupId,
        clientGroupName = c.ClientGroup?.Name,
        clientGroupColor = c.ClientGroup?.Color,
        tags = (c.Tags?.Count ?? 0) > 0 ? c.Tags : (c.ServiceScopes ?? []),
        preferredLanguage = c.PreferredLanguage,
        marketCountry = c.MarketCountry,
        needsQuickResponse = c.NeedsQuickResponse,
        timeZoneId = c.TimeZoneId
    };

    private object MapDetail(
        Domain.Entities.Client c,
        List<Domain.Entities.Payment> payments,
        List<Domain.Entities.Contract> contracts,
        List<Domain.Entities.TodoItem> todos,
        List<Domain.Entities.AgendaEvent> events)
    {
        var openTodos = todos.Where(t => t.Status != TodoStatus.Done).ToList();
        static (decimal paid, decimal pending) LedgerTotals(IEnumerable<Domain.Entities.Payment> list, string ledger)
        {
            var slice = list.Where(p => (string.IsNullOrWhiteSpace(p.Ledger) ? "Agency" : p.Ledger) == ledger).ToList();
            return (slice.Where(p => p.IsSettled).Sum(p => p.Amount), slice.Where(p => !p.IsSettled).Sum(p => p.Amount));
        }
        var agency = LedgerTotals(payments, "Agency");
        var clientAr = LedgerTotals(payments, "ClientAr");
        var clientAp = LedgerTotals(payments, "ClientAp");
        var paidTotal = agency.paid;
        var pendingTotal = agency.pending;

        return new
        {
            id = c.Id,
            name = c.Name,
            phone = c.Phone,
            companyName = c.CompanyName,
            email = c.Email,
            status = c.Status.ToString(),
            crm = c.CrmNotes,
            relationshipStage = c.RelationshipStage,
            nextAction = c.NextAction,
            nextActionAtUtc = c.NextActionAtUtc,
            lastContactAtUtc = c.LastContactAtUtc,
            segment = c.Segment,
            clientGroupId = c.ClientGroupId,
            clientGroupName = c.ClientGroup?.Name,
            clientGroupColor = c.ClientGroup?.Color,
            tags = (c.Tags?.Count ?? 0) > 0 ? c.Tags : (c.ServiceScopes ?? []),
            preferredLanguage = c.PreferredLanguage,
            marketCountry = c.MarketCountry,
            needsQuickResponse = c.NeedsQuickResponse,
            document = c.Document,
            address = c.Address,
            financeNotes = c.FinanceNotes,
            contractNotes = c.ContractNotes,
            serviceWorkNotes = c.ServiceWorkNotes,
            additionalNotes = c.AdditionalNotes,
            contractCode = c.ContractCode,
            contractRenewalDate = c.ContractRenewalDate,
            timeZoneId = c.TimeZoneId,
            onboardingCompleted = c.OnboardingCompleted,
            createdAt = c.CreatedAt,
            topics = c.Topics.Select(t => new { id = t.Id, clientId = c.Id, title = t.Title, content = t.Observation }),
            links = c.Links.Select(l => new { id = l.Id, clientId = c.Id, label = l.Label, url = l.Url }),
            credentials = c.Credentials.Select(x => new
            {
                id = x.Id,
                appName = x.AppName,
                login = x.Login,
                password = _protector.Decrypt(x.EncryptedPassword)
            }),
            apps = c.ClientApps.Select(a => new { id = a.Id, name = a.Name, appId = a.AppId }),
            crmEntries = c.CrmEntries.OrderByDescending(e => e.CreatedAt).Take(40).Select(e => new
            {
                id = e.Id,
                kind = e.Kind,
                summary = e.Summary,
                channel = e.Channel,
                followUpAtUtc = e.FollowUpAtUtc,
                createdByName = e.CreatedByName,
                createdAt = e.CreatedAt
            }),
            invoices = c.Invoices.OrderByDescending(i => i.PeriodEnd).Select(i => new
            {
                id = i.Id,
                reference = i.Reference,
                amount = i.Amount,
                periodStart = i.PeriodStart,
                periodEnd = i.PeriodEnd,
                status = i.Status,
                kind = i.Kind,
                counterpartyName = i.CounterpartyName,
                dueDate = i.DueDate,
                notes = i.Notes
            }),
            payments = payments.Select(p => new
            {
                id = p.Id,
                amount = p.Amount,
                description = p.Description,
                paidAt = p.PaidAt,
                dueDate = p.DueAt,
                ledger = string.IsNullOrWhiteSpace(p.Ledger) ? "Agency" : p.Ledger,
                counterpartyName = p.CounterpartyName,
                category = p.Category,
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
            }),
            contracts = contracts.Select(ct => new
            {
                id = ct.Id,
                name = ct.Name,
                status = ct.Status,
                type = ct.PartyType.ToString(),
                pdfUrl = ct.PdfPath
            }),
            todos = todos.Select(t => new
            {
                id = t.Id,
                title = t.Title,
                description = t.Description,
                status = t.Status.ToString()
            }),
            openTodos = openTodos.Select(t => new
            {
                id = t.Id,
                title = t.Title,
                status = t.Status.ToString()
            }),
            agenda = events.Select(e => new
            {
                id = e.Id,
                title = e.Title,
                startAt = e.StartsAt,
                endAt = e.EndsAt
            }),
            responsibles = c.EmployeeLinks.Select(l => new
            {
                id = l.Employee.Id,
                name = l.Employee.Name,
                color = l.Employee.Color,
                email = l.Employee.Email
            }),
            onboarding = c.OnboardingItems.OrderBy(i => i.SortOrder).Select(i => new
            {
                id = i.Id,
                title = i.Title,
                isCompleted = i.IsCompleted,
                sortOrder = i.SortOrder
            }),
            summary = new
            {
                since = c.CreatedAt,
                paidTotal,
                pendingTotal,
                agencyPaid = agency.paid,
                agencyPending = agency.pending,
                clientArPaid = clientAr.paid,
                clientArPending = clientAr.pending,
                clientApPaid = clientAp.paid,
                clientApPending = clientAp.pending,
                openTodos = openTodos.Count,
                invoices = c.Invoices.Count,
                apps = c.ClientApps.Count,
                credentials = c.Credentials.Count,
                contracts = contracts.Count
            }
        };
    }

    public record UpsertClientBody(
        string Name,
        string? Phone,
        string? CompanyName,
        string? Email,
        string? CrmNotes,
        string? Crm,
        string? Segment,
        Guid? ClientGroupId,
        bool? ClearGroup,
        List<string>? Tags,
        List<string>? ServiceScopes,
        string? PreferredLanguage,
        string? MarketCountry,
        bool? NeedsQuickResponse,
        string? Document,
        string? Address,
        string? FinanceNotes,
        string? ContractNotes,
        string? ServiceWorkNotes,
        string? AdditionalNotes,
        string? ContractCode,
        DateOnly? ContractRenewalDate,
        string? TimeZoneId);
    public record NotesBody(
        string? Crm, string? FinanceNotes, string? ContractNotes, string? ServiceWorkNotes, string? AdditionalNotes,
        string? RelationshipStage, string? NextAction, DateTime? NextActionAtUtc, bool? ClearNextAction);
    public record CrmEntryBody(string Summary, string? Kind, string? Channel, DateTime? FollowUpAtUtc, string? NextAction);
    public record PortalStaffMessageBody(string Body);
    public record StatusBody(
        string? Status, string? NewStatus,
        bool? EmailSent, bool? EmailSentConfirmed,
        bool? PaymentSettled, bool? PendingPaymentSettled,
        bool? FinalMessageSent,
        bool? PendingResolved, bool? PendenciesResolved,
        bool? RemovedFromGroup);
    public record TopicBody(string Title, string? Content, string? Observation);
    public record LinkBody(string Label, string Url);
    public record CredentialBody(string AppName, string Login, string Password);
    public record AppBody(string Name, Guid? AppId);
    public record InvoiceBody(
        string Reference, decimal Amount, DateOnly PeriodStart, DateOnly PeriodEnd, string? Status,
        string? Kind, string? CounterpartyName, DateOnly? DueDate, string? Notes);
}
