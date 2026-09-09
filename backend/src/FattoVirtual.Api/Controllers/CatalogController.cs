using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1")]
public class CatalogController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    public CatalogController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet("partners")]
    [RequirePermission(Permissions.PartnersRead)]
    public async Task<IActionResult> Partners()
    {
        var orgId = User.GetOrganizationId();
        var items = await _db.PartnerCompanies
            .Include(x => x.ClientLinks).ThenInclude(l => l.Client)
            .Where(x => x.OrganizationId == orgId)
            .OrderBy(x => x.Name)
            .ToListAsync();
        return Ok(items.Select(p => new
        {
            id = p.Id,
            name = p.Name,
            responsibleName = p.ResponsibleName,
            contact = p.Contact,
            service = p.Service,
            notes = p.Observations,
            clients = p.ClientLinks
                .Where(l => l.Status == "Active")
                .Select(l => new { clientId = l.ClientId, clientName = l.Client?.Name, status = l.Status, notes = l.Notes })
        }));
    }

    [HttpPost("partners")]
    [RequirePermission(Permissions.PartnersWrite)]
    public async Task<IActionResult> CreatePartner([FromBody] PartnerBody body)
    {
        var e = new Domain.Entities.PartnerCompany
        {
            OrganizationId = User.GetOrganizationId(),
            Name = body.Name,
            ResponsibleName = body.ResponsibleName,
            Contact = body.Contact,
            Service = body.Service,
            Observations = body.Notes ?? body.Observations
        };
        _db.PartnerCompanies.Add(e);
        await _db.SaveChangesAsync();
        return Ok(new { id = e.Id, name = e.Name, responsibleName = e.ResponsibleName, contact = e.Contact, service = e.Service, notes = e.Observations, clients = Array.Empty<object>() });
    }

    [HttpPut("partners/{id:guid}")]
    [RequirePermission(Permissions.PartnersWrite)]
    public async Task<IActionResult> UpdatePartner(Guid id, [FromBody] PartnerBody body)
    {
        var e = await _db.PartnerCompanies.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == User.GetOrganizationId());
        if (e is null) return NotFound();
        e.Name = body.Name;
        e.ResponsibleName = body.ResponsibleName;
        e.Contact = body.Contact;
        e.Service = body.Service;
        e.Observations = body.Notes ?? body.Observations;
        e.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { id = e.Id, name = e.Name, responsibleName = e.ResponsibleName, contact = e.Contact, service = e.Service, notes = e.Observations });
    }

    [HttpPost("partners/{id:guid}/assign-client")]
    [RequirePermission(Permissions.PartnersWrite)]
    public async Task<IActionResult> AssignPartnerClient(Guid id, [FromBody] AssignPartnerBody body)
    {
        var orgId = User.GetOrganizationId();
        var partner = await _db.PartnerCompanies.FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId);
        if (partner is null) return NotFound();
        if (!await _db.Clients.AnyAsync(c => c.Id == body.ClientId && c.OrganizationId == orgId))
            return BadRequest(new { detail = "Cliente inválido." });

        var link = await _db.ClientPartners.FirstOrDefaultAsync(l => l.PartnerCompanyId == id && l.ClientId == body.ClientId);
        if (link is null)
        {
            link = new Domain.Entities.ClientPartner
            {
                OrganizationId = orgId,
                PartnerCompanyId = id,
                ClientId = body.ClientId,
                Status = body.Status ?? "Active",
                Notes = body.Notes
            };
            _db.ClientPartners.Add(link);
        }
        else
        {
            link.Status = body.Status ?? link.Status;
            link.Notes = body.Notes ?? link.Notes;
            link.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return Ok(new { id = link.Id, partnerId = id, clientId = body.ClientId, status = link.Status, notes = link.Notes });
    }

    [HttpDelete("partners/{id:guid}/clients/{clientId:guid}")]
    [RequirePermission(Permissions.PartnersWrite)]
    public async Task<IActionResult> UnassignPartnerClient(Guid id, Guid clientId)
    {
        var orgId = User.GetOrganizationId();
        var link = await _db.ClientPartners.FirstOrDefaultAsync(l =>
            l.PartnerCompanyId == id && l.ClientId == clientId && l.OrganizationId == orgId);
        if (link is null) return NotFound();
        _db.ClientPartners.Remove(link);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("clients/{clientId:guid}/partners")]
    [RequirePermission(Permissions.PartnersRead)]
    public async Task<IActionResult> ClientPartners(Guid clientId)
    {
        var orgId = User.GetOrganizationId();
        if (!await _db.Clients.AnyAsync(c => c.Id == clientId && c.OrganizationId == orgId))
            return NotFound();
        var items = await _db.ClientPartners.Include(l => l.PartnerCompany)
            .Where(l => l.ClientId == clientId && l.OrganizationId == orgId)
            .OrderBy(l => l.PartnerCompany.Name)
            .Select(l => new
            {
                id = l.Id,
                partnerId = l.PartnerCompanyId,
                name = l.PartnerCompany.Name,
                responsibleName = l.PartnerCompany.ResponsibleName,
                contact = l.PartnerCompany.Contact,
                service = l.PartnerCompany.Service,
                status = l.Status,
                notes = l.Notes
            }).ToListAsync();
        return Ok(items);
    }

    [HttpPost("clients/{clientId:guid}/partners")]
    [RequirePermission(Permissions.PartnersWrite)]
    public async Task<IActionResult> AssignClientPartner(Guid clientId, [FromBody] AssignClientPartnerBody body)
    {
        return await AssignPartnerClient(body.PartnerId, new AssignPartnerBody(clientId, body.Status, body.Notes));
    }

    [HttpGet("services")]
    [RequirePermission(Permissions.ServicesRead)]
    public async Task<IActionResult> Services([FromQuery] Guid? clientId)
    {
        var orgId = User.GetOrganizationId();
        var q = _db.ServiceItems.Include(s => s.ClientLinks).ThenInclude(l => l.Client)
            .Where(x => x.OrganizationId == orgId);
        if (clientId.HasValue)
            q = q.Where(s => s.ClientLinks.Any(l => l.ClientId == clientId && l.Status == "Active"));

        var items = await q.OrderBy(x => x.Title).ToListAsync();
        return Ok(items.Select(MapService));
    }

    [HttpPost("services")]
    [RequirePermission(Permissions.ServicesWrite)]
    public async Task<IActionResult> CreateService([FromBody] ServiceBody body)
    {
        var e = new Domain.Entities.ServiceItem
        {
            OrganizationId = User.GetOrganizationId(),
            Title = body.Title,
            Description = body.Description ?? "",
            Category = string.IsNullOrWhiteSpace(body.Category) ? "Geral" : body.Category!,
            Specificities = body.Specificities ?? [],
            AssistantNotes = body.AssistantNotes,
            ClientFacingNotes = body.ClientFacingNotes,
            IsActive = body.IsActive ?? true
        };
        _db.ServiceItems.Add(e);
        await _db.SaveChangesAsync();
        return Ok(MapService(e));
    }

    [HttpPut("services/{id:guid}")]
    [RequirePermission(Permissions.ServicesWrite)]
    public async Task<IActionResult> UpdateService(Guid id, [FromBody] ServiceBody body)
    {
        var e = await _db.ServiceItems.Include(s => s.ClientLinks).ThenInclude(l => l.Client)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == User.GetOrganizationId());
        if (e is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(body.Title)) e.Title = body.Title;
        if (body.Description is not null) e.Description = body.Description;
        if (body.Category is not null) e.Category = body.Category;
        if (body.Specificities is not null) e.Specificities = body.Specificities;
        if (body.AssistantNotes is not null) e.AssistantNotes = body.AssistantNotes;
        if (body.ClientFacingNotes is not null) e.ClientFacingNotes = body.ClientFacingNotes;
        if (body.IsActive.HasValue) e.IsActive = body.IsActive.Value;
        e.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(MapService(e));
    }

    [HttpPost("services/{id:guid}/assign-client")]
    [RequirePermission(Permissions.ServicesWrite)]
    public async Task<IActionResult> AssignClient(Guid id, [FromBody] AssignServiceBody body)
    {
        var orgId = User.GetOrganizationId();
        var service = await _db.ServiceItems.FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == orgId);
        if (service is null) return NotFound();
        var clientOk = await ClientScope.Query(_db, User).AnyAsync(c => c.Id == body.ClientId);
        if (!clientOk) return BadRequest(new { detail = "Cliente inválido." });

        var link = await _db.ClientServices.FirstOrDefaultAsync(l =>
            l.ServiceItemId == id && l.ClientId == body.ClientId);
        if (link is null)
        {
            link = new Domain.Entities.ClientService
            {
                OrganizationId = orgId,
                ServiceItemId = id,
                ClientId = body.ClientId,
                Status = body.Status ?? "Active",
                CustomNotes = body.CustomNotes,
                AssignedAssistantUserId = body.AssignedAssistantUserId
            };
            _db.ClientServices.Add(link);
        }
        else
        {
            link.Status = body.Status ?? link.Status;
            if (body.CustomNotes is not null) link.CustomNotes = body.CustomNotes;
            if (body.AssignedAssistantUserId is not null) link.AssignedAssistantUserId = body.AssignedAssistantUserId;
            link.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return Ok(new { id = link.Id, clientId = link.ClientId, serviceId = link.ServiceItemId, status = link.Status });
    }

    [HttpGet("clients/{clientId:guid}/services")]
    [RequirePermission(Permissions.ServicesRead)]
    public async Task<IActionResult> ClientServices(Guid clientId)
    {
        var ok = await ClientScope.Query(_db, User).AnyAsync(c => c.Id == clientId);
        if (!ok) return NotFound();
        var links = await _db.ClientServices.Include(l => l.ServiceItem)
            .Where(l => l.ClientId == clientId && l.OrganizationId == User.GetOrganizationId())
            .OrderBy(l => l.ServiceItem.Title)
            .Select(l => new
            {
                id = l.Id,
                status = l.Status,
                customNotes = l.CustomNotes,
                assignedAssistantUserId = l.AssignedAssistantUserId,
                service = new
                {
                    id = l.ServiceItem.Id,
                    title = l.ServiceItem.Title,
                    category = l.ServiceItem.Category,
                    specificities = l.ServiceItem.Specificities,
                    clientFacingNotes = l.ServiceItem.ClientFacingNotes
                }
            })
            .ToListAsync();
        return Ok(links);
    }

    private static object MapService(Domain.Entities.ServiceItem e) => new
    {
        id = e.Id,
        title = e.Title,
        description = e.Description,
        category = e.Category,
        specificities = e.Specificities,
        assistantNotes = e.AssistantNotes,
        clientFacingNotes = e.ClientFacingNotes,
        isActive = e.IsActive,
        clients = e.ClientLinks?.Where(l => l.Status == "Active").Select(l => new
        {
            clientId = l.ClientId,
            clientName = l.Client?.Name,
            status = l.Status,
            customNotes = l.CustomNotes
        }) ?? []
    };

    [HttpGet("contracts")]
    [RequirePermission(Permissions.ContractsRead)]
    public async Task<IActionResult> Contracts([FromQuery] string? partyType, [FromQuery] Guid? clientId, [FromQuery] Guid? employeeId)
    {
        var q = _db.Contracts.Include(c => c.Client).Include(c => c.Employee)
            .Where(c => c.OrganizationId == User.GetOrganizationId());
        if (!string.IsNullOrWhiteSpace(partyType) && Enum.TryParse<ContractPartyType>(partyType, true, out var pt))
            q = q.Where(c => c.PartyType == pt);
        if (clientId.HasValue) q = q.Where(c => c.ClientId == clientId);
        if (employeeId.HasValue) q = q.Where(c => c.EmployeeId == employeeId);

        var items = await q.OrderBy(c => c.Name).ToListAsync();
        return Ok(items.Select(MapContract));
    }

    [HttpPost("contracts")]
    [RequirePermission(Permissions.ContractsWrite)]
    public async Task<IActionResult> CreateContract([FromBody] ContractBody body)
    {
        var err = await ValidateContractPartyAsync(body);
        if (err is not null) return err;

        if (!Enum.TryParse<ContractPartyType>(body.Type ?? body.PartyType, true, out var type))
            type = body.EmployeeId.HasValue ? ContractPartyType.Provider : ContractPartyType.Client;

        var e = new Domain.Entities.Contract
        {
            OrganizationId = User.GetOrganizationId(),
            Name = body.Name,
            Status = body.Status ?? "Active",
            PartyType = type,
            ClientId = type == ContractPartyType.Client ? body.ClientId : null,
            EmployeeId = type == ContractPartyType.Provider ? body.EmployeeId : null
        };
        _db.Contracts.Add(e);
        await _db.SaveChangesAsync();
        await _db.Entry(e).Reference(x => x.Client).LoadAsync();
        await _db.Entry(e).Reference(x => x.Employee).LoadAsync();
        return Ok(MapContract(e));
    }

    [HttpPut("contracts/{id:guid}")]
    [RequirePermission(Permissions.ContractsWrite)]
    public async Task<IActionResult> UpdateContract(Guid id, [FromBody] ContractBody body)
    {
        var e = await _db.Contracts.Include(c => c.Client).Include(c => c.Employee)
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == User.GetOrganizationId());
        if (e is null) return NotFound();

        var err = await ValidateContractPartyAsync(body, e.PartyType);
        if (err is not null) return err;

        if (!Enum.TryParse<ContractPartyType>(body.Type ?? body.PartyType, true, out var type))
            type = e.PartyType;

        e.Name = body.Name;
        e.Status = body.Status ?? e.Status;
        e.PartyType = type;
        e.ClientId = type == ContractPartyType.Client ? body.ClientId : null;
        e.EmployeeId = type == ContractPartyType.Provider ? body.EmployeeId : null;
        e.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(e).Reference(x => x.Client).LoadAsync();
        await _db.Entry(e).Reference(x => x.Employee).LoadAsync();
        return Ok(MapContract(e));
    }

    [HttpPost("contracts/{id:guid}/pdf")]
    [RequirePermission(Permissions.ContractsWrite)]
    public async Task<IActionResult> UploadPdf(Guid id, IFormFile file)
    {
        var contract = await _db.Contracts.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == User.GetOrganizationId());
        if (contract is null) return NotFound();
        var dir = Path.Combine(_env.ContentRootPath, "storage", "contracts");
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, $"{id}.pdf");
        await using (var stream = System.IO.File.Create(path))
            await file.CopyToAsync(stream);
        contract.PdfPath = $"/api/v1/contracts/{id}/pdf";
        contract.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { pdfUrl = contract.PdfPath });
    }

    [HttpGet("contracts/{id:guid}/pdf")]
    [RequirePermission(Permissions.ContractsRead)]
    public async Task<IActionResult> GetPdf(Guid id)
    {
        var contract = await _db.Contracts.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == User.GetOrganizationId());
        if (contract is null) return NotFound();
        var path = Path.Combine(_env.ContentRootPath, "storage", "contracts", $"{id}.pdf");
        if (!System.IO.File.Exists(path)) return NotFound();
        return PhysicalFile(path, "application/pdf", enableRangeProcessing: true);
    }

    object MapContract(Domain.Entities.Contract c) => new
    {
        id = c.Id,
        name = c.Name,
        type = c.PartyType.ToString(),
        status = c.Status,
        pdfUrl = c.PdfPath,
        clientId = c.ClientId,
        employeeId = c.EmployeeId,
        partyName = c.Client?.Name ?? c.Employee?.Name,
        partyPath = c.ClientId is Guid cid
            ? $"/clientes/{cid}"
            : c.EmployeeId is Guid eid
                ? $"/prestadores/{eid}"
                : null
    };

    async Task<IActionResult?> ValidateContractPartyAsync(ContractBody body, ContractPartyType? fallback = null)
    {
        var orgId = User.GetOrganizationId();
        ContractPartyType type;
        if (!Enum.TryParse<ContractPartyType>(body.Type ?? body.PartyType, true, out type))
        {
            type = fallback
                ?? (body.EmployeeId.HasValue ? ContractPartyType.Provider : ContractPartyType.Client);
        }

        if (type == ContractPartyType.Client)
        {
            if (body.ClientId is null || body.ClientId == Guid.Empty)
                return BadRequest(new { detail = "Contrato de cliente exige ClientId." });
            if (!await _db.Clients.AnyAsync(c => c.Id == body.ClientId && c.OrganizationId == orgId))
                return BadRequest(new { detail = "Cliente inválido." });
        }
        else
        {
            if (body.EmployeeId is null || body.EmployeeId == Guid.Empty)
                return BadRequest(new { detail = "Contrato de prestador/admin exige EmployeeId." });
            if (!await _db.Employees.AnyAsync(e => e.Id == body.EmployeeId && e.OrganizationId == orgId))
                return BadRequest(new { detail = "Prestador inválido." });
        }
        return null;
    }

    [HttpGet("apps")]
    [RequirePermission(Permissions.AppsRead)]
    public async Task<IActionResult> Apps() =>
        Ok(await _db.AppCatalogItems.Where(x => x.OrganizationId == User.GetOrganizationId())
            .OrderBy(x => x.Name)
            .Select(x => new { id = x.Id, name = x.Name, homeUrl = x.HomeUrl, downloadUrl = x.DownloadUrl })
            .ToListAsync());

    [HttpPost("apps")]
    [RequirePermission(Permissions.AppsWrite)]
    public async Task<IActionResult> CreateApp([FromBody] AppBody body)
    {
        var e = new Domain.Entities.AppCatalogItem
        {
            OrganizationId = User.GetOrganizationId(),
            Name = body.Name,
            HomeUrl = body.HomeUrl,
            DownloadUrl = body.DownloadUrl
        };
        _db.AppCatalogItems.Add(e);
        await _db.SaveChangesAsync();
        return Ok(new { id = e.Id, name = e.Name, homeUrl = e.HomeUrl, downloadUrl = e.DownloadUrl });
    }

    public record PartnerBody(string Name, string? ResponsibleName, string? Contact, string? Service, string? Notes, string? Observations);
    public record AssignPartnerBody(Guid ClientId, string? Status, string? Notes);
    public record AssignClientPartnerBody(Guid PartnerId, string? Status, string? Notes);
    public record ServiceBody(
        string Title,
        string? Description,
        string? Category,
        List<string>? Specificities,
        string? AssistantNotes,
        string? ClientFacingNotes,
        bool? IsActive);
    public record AssignServiceBody(Guid ClientId, string? Status, string? CustomNotes, string? AssignedAssistantUserId);
    public record ContractBody(string Name, string? Status, string? Type, string? PartyType, Guid? ClientId, Guid? EmployeeId);
    public record AppBody(string Name, string? HomeUrl, string? DownloadUrl);
}
