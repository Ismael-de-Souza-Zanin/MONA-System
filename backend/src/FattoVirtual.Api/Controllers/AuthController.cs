using FattoVirtual.Infrastructure.Identity;
using FattoVirtual.Infrastructure.Persistence;
using FattoVirtual.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _users;
    private readonly IJwtTokenService _jwt;
    private readonly AppDbContext _db;

    public AuthController(UserManager<AppUser> users, IJwtTokenService jwt, AppDbContext db)
    {
        _users = users;
        _jwt = jwt;
        _db = db;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginBody body)
    {
        var user = await _users.FindByEmailAsync(body.Email);
        if (user is null || !await _users.CheckPasswordAsync(user, body.Password))
            return Unauthorized(new { detail = "Credenciais inválidas." });

        var permissions = await ResolvePermissions(user);
        var tokens = await _jwt.CreateTokensAsync(user, permissions);
        return Ok(new
        {
            accessToken = tokens.AccessToken,
            refreshToken = tokens.RefreshToken,
            expiresAt = tokens.ExpiresAt,
            user = Mapping.MapUser(user, permissions)
        });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshBody body)
    {
        var tokens = await _jwt.RefreshAsync(body.RefreshToken);
        if (tokens is null) return Unauthorized(new { detail = "Refresh inválido." });
        return Ok(new
        {
            accessToken = tokens.Value.AccessToken,
            refreshToken = tokens.Value.RefreshToken,
            expiresAt = tokens.Value.ExpiresAt
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshBody? body)
    {
        if (!string.IsNullOrWhiteSpace(body?.RefreshToken))
            await _jwt.RevokeAsync(body.RefreshToken);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _users.FindByIdAsync(User.GetUserId());
        if (user is null) return Unauthorized();
        var permissions = await ResolvePermissions(user);
        return Ok(Mapping.MapUser(user, permissions));
    }

    /// <summary>Confere senha da Ju / conta principal / co-admin da org (reauth operacional).</summary>
    [HttpPost("verify-admin-password")]
    [Authorize]
    public async Task<IActionResult> VerifyAdminPassword([FromBody] AdminPasswordBody body)
    {
        if (string.IsNullOrWhiteSpace(body.Password))
            return BadRequest(new { detail = "Informe a senha." });

        var orgId = User.GetOrganizationId();
        var ownerTypeIds = await _db.AccessTypes
            .Where(a => a.OrganizationId == orgId && a.IsOwnerType)
            .Select(a => a.Id)
            .ToListAsync();
        var admins = await _db.Users
            .Where(u => u.OrganizationId == orgId &&
                        (u.IsOrganizationOwner ||
                         (u.AccessTypeId != null && ownerTypeIds.Contains(u.AccessTypeId.Value))))
            .ToListAsync();

        foreach (var admin in admins)
        {
            if (await _users.CheckPasswordAsync(admin, body.Password))
                return Ok(new { ok = true });
        }
        return Unauthorized(new { detail = "Senha da Ju/admin inválida." });
    }

    private async Task<List<string>> ResolvePermissions(AppUser user)
    {
        if (user.IsOrganizationOwner) return Domain.Enums.Permissions.OwnerDefaults.ToList();
        if (user.AccessTypeId is null) return [];
        var access = await _db.AccessTypes.FirstOrDefaultAsync(x => x.Id == user.AccessTypeId);
        return access?.Permissions ?? [];
    }

    public record LoginBody(string Email, string Password);
    public record RefreshBody(string RefreshToken);
    public record AdminPasswordBody(string Password);
}
