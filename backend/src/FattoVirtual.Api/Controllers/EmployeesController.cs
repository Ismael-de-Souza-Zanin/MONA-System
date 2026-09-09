using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1")]
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _db;
    public EmployeesController(AppDbContext db) => _db = db;

    [HttpGet("employees")]
    [RequirePermission(Permissions.EmployeesRead)]
    public async Task<IActionResult> List()
    {
        var items = await _db.Employees
            .Where(e => e.OrganizationId == User.GetOrganizationId())
            .OrderBy(e => e.Name)
            .Select(e => new
            {
                id = e.Id,
                name = e.Name,
                phone = e.Phone,
                email = e.Email,
                color = e.Color,
                status = e.Status,
                managerId = e.ManagerId
            }).ToListAsync();
        return Ok(items);
    }

    [HttpPost("employees")]
    [RequirePermission(Permissions.EmployeesWrite)]
    public async Task<IActionResult> Create([FromBody] EmployeeBody body)
    {
        var e = new Domain.Entities.Employee
        {
            OrganizationId = User.GetOrganizationId(),
            Name = body.Name,
            Phone = body.Phone,
            Email = body.Email,
            Color = body.Color ?? "#0F4C5C",
            ManagerId = body.ManagerId,
            Status = body.Status ?? "Active",
            UserId = body.UserId
        };
        _db.Employees.Add(e);
        await _db.SaveChangesAsync();
        return Ok(new { id = e.Id, name = e.Name, phone = e.Phone, email = e.Email, color = e.Color, status = e.Status, managerId = e.ManagerId });
    }

    [HttpGet("employees/{id:guid}/summary")]
    [RequirePermission(Permissions.EmployeesRead)]
    public async Task<IActionResult> Summary(Guid id)
    {
        var e = await _db.Employees
            .Include(x => x.ClientLinks).ThenInclude(x => x.Client)
            .Include(x => x.Payments)
            .Include(x => x.ScheduleDays)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == User.GetOrganizationId());
        if (e is null) return NotFound();

        var contracts = await _db.Contracts
            .Where(c => c.EmployeeId == id)
            .Select(c => new { id = c.Id, name = c.Name, status = c.Status, type = c.PartyType.ToString(), pdfUrl = c.PdfPath })
            .ToListAsync();

        var todos = await _db.TodoItems
            .Where(t => t.OrganizationId == User.GetOrganizationId() && t.AssignedUserId == e.UserId)
            .Select(t => new
            {
                id = t.Id,
                title = t.Title,
                description = t.Description,
                status = t.Status.ToString(),
                ownerUserId = t.AssignedUserId,
                clientId = t.ClientId,
                isGeneral = t.Scope == TodoScope.General,
                comments = Array.Empty<object>()
            }).ToListAsync();

        return Ok(new
        {
            id = e.Id,
            name = e.Name,
            phone = e.Phone,
            email = e.Email,
            color = e.Color,
            status = e.Status,
            managerId = e.ManagerId,
            contractNotes = contracts.FirstOrDefault()?.name,
            contracts,
            payments = e.Payments.Select(p => new
            {
                id = p.Id,
                amount = p.Amount,
                description = p.Description,
                paidAt = p.PaidAt,
                status = p.IsSettled ? "Paid" : "Pending"
            }),
            assignedClients = e.ClientLinks.Select(l => new
            {
                id = l.Client.Id,
                name = l.Client.Name,
                phone = l.Client.Phone,
                companyName = l.Client.CompanyName,
                status = l.Client.Status.ToString()
            }),
            todos,
            workDays = e.ScheduleDays.Select(d => new
            {
                date = d.Date.ToString("yyyy-MM-dd"),
                type = d.IsWorkDay ? "work" : "off"
            })
        });
    }

    [HttpPost("employees/{id:guid}/clients/{clientId:guid}")]
    [RequirePermission(Permissions.EmployeesWrite)]
    public async Task<IActionResult> AssignClient(Guid id, Guid clientId)
    {
        if (!await _db.Employees.AnyAsync(e => e.Id == id && e.OrganizationId == User.GetOrganizationId()))
            return NotFound();
        if (!await _db.Clients.AnyAsync(c => c.Id == clientId && c.OrganizationId == User.GetOrganizationId()))
            return NotFound();
        if (!await _db.EmployeeClients.AnyAsync(x => x.EmployeeId == id && x.ClientId == clientId))
        {
            _db.EmployeeClients.Add(new Domain.Entities.EmployeeClient { EmployeeId = id, ClientId = clientId });
            await _db.SaveChangesAsync();
        }
        return NoContent();
    }

    [HttpDelete("employees/{id:guid}/clients/{clientId:guid}")]
    [RequirePermission(Permissions.EmployeesWrite)]
    public async Task<IActionResult> UnassignClient(Guid id, Guid clientId)
    {
        var link = await _db.EmployeeClients.FirstOrDefaultAsync(x => x.EmployeeId == id && x.ClientId == clientId);
        if (link is null) return NotFound();
        var emp = await _db.Employees.AnyAsync(e => e.Id == id && e.OrganizationId == User.GetOrganizationId());
        if (!emp) return NotFound();
        _db.EmployeeClients.Remove(link);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("pyramid")]
    [RequirePermission(Permissions.PyramidView)]
    public async Task<IActionResult> Pyramid()
    {
        if (!User.IsOwner() && !User.HasPermission(Permissions.PyramidView))
            return Forbid();

        var employees = await _db.Employees
            .Where(e => e.OrganizationId == User.GetOrganizationId())
            .ToListAsync();

        Domain.Entities.Employee? FindRoot()
        {
            var roots = employees.Where(e => e.ManagerId is null || employees.All(m => m.Id != e.ManagerId)).ToList();
            return roots.FirstOrDefault();
        }

        object Build(Domain.Entities.Employee node) => new
        {
            id = node.Id,
            name = node.Name,
            color = node.Color,
            children = employees.Where(e => e.ManagerId == node.Id).Select(Build).ToList()
        };

        var root = FindRoot();
        if (root is null)
            return Ok(new { id = Guid.Empty, name = "Sem hierarquia", children = Array.Empty<object>() });

        // If multiple roots, wrap them
        var roots = employees.Where(e => e.ManagerId is null || employees.All(m => m.Id != e.ManagerId)).ToList();
        if (roots.Count == 1) return Ok(Build(roots[0]));
        return Ok(new
        {
            id = Guid.Empty,
            name = "Organização",
            color = "#0F4C5C",
            children = roots.Select(Build).ToList()
        });
    }

    public record EmployeeBody(string Name, string? Phone, string? Email, string? Color, Guid? ManagerId, string? Status, string? UserId);
}
