using System.Security.Claims;
using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Identity;
using FattoVirtual.Infrastructure.Persistence;
using FattoVirtual.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api;

public static class UserContextExtensions
{
    public static string GetUserId(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException();

    public static Guid GetOrganizationId(this ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue("org_id")!);

    public static bool IsOwner(this ClaimsPrincipal user) =>
        string.Equals(user.FindFirstValue("is_owner"), "true", StringComparison.OrdinalIgnoreCase);

    public static bool HasPermission(this ClaimsPrincipal user, string permission) =>
        user.IsOwner() || user.FindAll("permission").Any(c => c.Value == permission);

    public static List<Guid> GetAssignedClientIds(this ClaimsPrincipal user) =>
        user.FindAll("client_id").Select(c => Guid.Parse(c.Value)).ToList();
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class RequirePermissionAttribute : Attribute, IAsyncActionFilter
{
    private readonly string _permission;
    public RequirePermissionAttribute(string permission) => _permission = permission;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (context.HttpContext.User?.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        if (!context.HttpContext.User.HasPermission(_permission))
        {
            context.Result = new ObjectResult(new { detail = "Sem permissão." }) { StatusCode = 403 };
            return;
        }

        await next();
    }
}

public static class Mapping
{
    public static object MapUser(AppUser user, IEnumerable<string> permissions) => new
    {
        id = user.Id,
        name = user.FullName,
        email = user.Email,
        organizationId = user.OrganizationId.ToString(),
        isOwner = user.IsOrganizationOwner,
        permissions = permissions.ToList(),
        assignedClientIds = user.AssignedClientIds.Select(x => x.ToString()).ToList()
    };
}

public static class ClientScope
{
    public static IQueryable<Domain.Entities.Client> Query(AppDbContext db, ClaimsPrincipal user)
    {
        var q = db.Clients.Where(c => c.OrganizationId == user.GetOrganizationId());
        if (!user.IsOwner())
        {
            var ids = user.GetAssignedClientIds();
            q = q.Where(c => ids.Contains(c.Id));
        }
        return q;
    }
}
