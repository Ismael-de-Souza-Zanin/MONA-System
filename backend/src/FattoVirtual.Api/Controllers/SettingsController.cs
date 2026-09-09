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
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _users;

    public SettingsController(AppDbContext db, UserManager<AppUser> users)
    {
        _db = db;
        _users = users;
    }

    [HttpGet("organizations/me")]
    public async Task<IActionResult> GetOrg()
    {
        var org = await _db.Organizations.FirstAsync(x => x.Id == User.GetOrganizationId());
        return Ok(new
        {
            id = org.Id,
            name = org.Name,
            document = org.Document,
            phone = org.Phone,
            email = org.Email,
            address = org.Address,
            whatsAppSupportUrl = org.SupportWhatsAppUrl
        });
    }

    [HttpPatch("organizations/me")]
    [RequirePermission(Permissions.Settings)]
    public async Task<IActionResult> UpdateOrg([FromBody] OrgBody body)
    {
        var org = await _db.Organizations.FirstAsync(x => x.Id == User.GetOrganizationId());
        org.Name = body.Name;
        org.Document = body.Document;
        org.Phone = body.Phone;
        org.Email = body.Email;
        org.Address = body.Address;
        org.SupportWhatsAppUrl = body.WhatsAppSupportUrl ?? body.SupportWhatsAppUrl;
        org.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await GetOrg();
    }

    [HttpGet("users/me")]
    public async Task<IActionResult> GetUser()
    {
        var user = await _users.FindByIdAsync(User.GetUserId());
        if (user is null) return NotFound();
        return Ok(new { id = user.Id, name = user.FullName, email = user.Email, phone = user.PhoneNumber });
    }

    [HttpPatch("users/me")]
    public async Task<IActionResult> UpdateUser([FromBody] UserBody body)
    {
        var user = await _users.FindByIdAsync(User.GetUserId());
        if (user is null) return NotFound();
        user.FullName = body.Name ?? body.FullName ?? user.FullName;
        if (body.Phone is not null) user.PhoneNumber = body.Phone;
        await _users.UpdateAsync(user);
        return Ok(new { id = user.Id, name = user.FullName, email = user.Email, phone = user.PhoneNumber });
    }

    [HttpGet("access-types")]
    [RequirePermission(Permissions.Settings)]
    public async Task<IActionResult> ListAccessTypes()
    {
        var items = await _db.AccessTypes
            .Where(x => x.OrganizationId == User.GetOrganizationId())
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                id = x.Id,
                name = x.Name,
                description = x.Description,
                permissions = x.Permissions,
                isOwnerType = x.IsOwnerType
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("access-types")]
    [RequirePermission(Permissions.Settings)]
    public async Task<IActionResult> CreateAccessType([FromBody] AccessTypeBody body)
    {
        var entity = new Domain.Entities.AccessType
        {
            OrganizationId = User.GetOrganizationId(),
            Name = body.Name,
            Description = body.Description ?? string.Empty,
            Permissions = body.Permissions ?? []
        };
        _db.AccessTypes.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, name = entity.Name, permissions = entity.Permissions });
    }

    [HttpPut("access-types/{id:guid}")]
    [RequirePermission(Permissions.Settings)]
    public async Task<IActionResult> UpdateAccessType(Guid id, [FromBody] AccessTypeBody body)
    {
        var entity = await _db.AccessTypes.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == User.GetOrganizationId());
        if (entity is null) return NotFound();
        if (entity.IsOwnerType) return BadRequest(new { detail = "Tipo owner não pode ser alterado." });
        entity.Name = body.Name;
        entity.Description = body.Description ?? entity.Description;
        entity.Permissions = body.Permissions ?? entity.Permissions;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, name = entity.Name, permissions = entity.Permissions });
    }

    [HttpGet("shared-users")]
    [RequirePermission(Permissions.Settings)]
    public async Task<IActionResult> ListSharedUsers()
    {
        if (!User.IsOwner() && !User.HasPermission(Permissions.Settings))
            return StatusCode(403, new { detail = "Somente a conta principal gerencia usuários." });

        var orgId = User.GetOrganizationId();
        var currentUserId = User.GetUserId();
        var users = await _db.Users
            .Where(x => x.OrganizationId == orgId)
            .OrderByDescending(x => x.IsOrganizationOwner)
            .ThenBy(x => x.FullName)
            .ToListAsync();
        var types = await _db.AccessTypes.Where(x => x.OrganizationId == orgId).ToDictionaryAsync(x => x.Id, x => x.Name);
        return Ok(users.Select(u => new
        {
            id = u.Id,
            name = u.FullName,
            email = u.Email,
            accessTypeId = u.AccessTypeId,
            accessTypeName = u.AccessTypeId is null ? null : types.GetValueOrDefault(u.AccessTypeId.Value),
            assignedClientIds = u.AssignedClientIds.Select(x => x.ToString()).ToList(),
            isOwner = u.IsOrganizationOwner,
            isCurrentUser = u.Id == currentUserId
        }));
    }

    [HttpPost("shared-users")]
    [RequirePermission(Permissions.Settings)]
    public async Task<IActionResult> CreateSharedUser([FromBody] SharedUserBody body)
    {
        // Conta principal pode criar usuários de qualquer nível, inclusive hierarquia igual (owner/co-admin).
        if (!User.IsOwner())
            return StatusCode(403, new { detail = "Somente a conta principal pode criar logins." });

        if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
            return BadRequest(new { detail = "E-mail e senha são obrigatórios." });

        var orgId = User.GetOrganizationId();
        var accessType = await _db.AccessTypes.FirstOrDefaultAsync(x =>
            x.Id == body.AccessTypeId && x.OrganizationId == orgId);
        if (accessType is null)
            return BadRequest(new { detail = "Tipo de acesso inválido." });

        var existing = await _users.FindByEmailAsync(body.Email);
        if (existing is not null)
            return BadRequest(new { detail = "Já existe um usuário com este e-mail." });

        var equalHierarchy = accessType.IsOwnerType || body.IsOwner == true;
        var user = new AppUser
        {
            UserName = body.Email.Trim(),
            Email = body.Email.Trim(),
            FullName = body.Name ?? body.FullName ?? body.Email.Trim(),
            OrganizationId = orgId,
            AccessTypeId = accessType.Id,
            AssignedClientIds = equalHierarchy ? [] : (body.AssignedClientIds ?? []),
            IsOrganizationOwner = equalHierarchy,
            EmailConfirmed = true
        };
        var result = await _users.CreateAsync(user, body.Password);
        if (!result.Succeeded)
            return BadRequest(new { detail = string.Join("; ", result.Errors.Select(e => e.Description)) });

        return Ok(new
        {
            id = user.Id,
            name = user.FullName,
            email = user.Email,
            accessTypeId = user.AccessTypeId,
            assignedClientIds = user.AssignedClientIds.Select(x => x.ToString()).ToList(),
            isOwner = user.IsOrganizationOwner
        });
    }

    public record OrgBody(string Name, string? Document, string? Phone, string? Email, string? Address, string? WhatsAppSupportUrl, string? SupportWhatsAppUrl);
    public record UserBody(string? Name, string? FullName, string? Phone);
    public record AccessTypeBody(string Name, string? Description, List<string>? Permissions);
    public record SharedUserBody(
        string Email,
        string Password,
        Guid AccessTypeId,
        string? Name,
        string? FullName,
        List<Guid>? AssignedClientIds,
        bool? IsOwner);
}
