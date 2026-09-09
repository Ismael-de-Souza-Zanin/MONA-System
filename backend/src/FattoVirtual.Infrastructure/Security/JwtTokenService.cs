using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FattoVirtual.Infrastructure.Identity;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace FattoVirtual.Infrastructure.Security;

public interface IJwtTokenService
{
    Task<(string AccessToken, string RefreshToken, DateTime ExpiresAt)> CreateTokensAsync(AppUser user, IEnumerable<string> permissions);
    Task<(string AccessToken, string RefreshToken, DateTime ExpiresAt)?> RefreshAsync(string refreshToken);
    Task RevokeAsync(string refreshToken);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _db;

    public JwtTokenService(IConfiguration configuration, AppDbContext db)
    {
        _configuration = configuration;
        _db = db;
    }

    public async Task<(string AccessToken, string RefreshToken, DateTime ExpiresAt)> CreateTokensAsync(
        AppUser user, IEnumerable<string> permissions)
    {
        var expires = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:AccessTokenMinutes"] ?? "60"));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new("name", user.FullName),
            new("org_id", user.OrganizationId.ToString()),
            new("is_owner", user.IsOrganizationOwner.ToString().ToLowerInvariant())
        };

        foreach (var permission in permissions.Distinct())
            claims.Add(new Claim("permission", permission));

        foreach (var clientId in user.AssignedClientIds)
            claims.Add(new Claim("client_id", clientId.ToString()));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refresh = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = refresh,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_configuration["Jwt:RefreshTokenDays"] ?? "14"))
        });
        await _db.SaveChangesAsync();
        return (accessToken, refresh, expires);
    }

    public async Task<(string AccessToken, string RefreshToken, DateTime ExpiresAt)?> RefreshAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == refreshToken && !x.IsRevoked);
        if (stored is null || stored.ExpiresAt < DateTime.UtcNow) return null;

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == stored.UserId);
        if (user is null) return null;

        stored.IsRevoked = true;
        var permissions = await ResolvePermissionsAsync(user);
        return await CreateTokensAsync(user, permissions);
    }

    public async Task RevokeAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == refreshToken);
        if (stored is null) return;
        stored.IsRevoked = true;
        await _db.SaveChangesAsync();
    }

    public async Task<List<string>> ResolvePermissionsAsync(AppUser user)
    {
        if (user.IsOrganizationOwner)
            return Domain.Enums.Permissions.OwnerDefaults.ToList();

        if (user.AccessTypeId is null) return [];
        var accessType = await _db.AccessTypes.FirstOrDefaultAsync(x => x.Id == user.AccessTypeId);
        return accessType?.Permissions ?? [];
    }
}
