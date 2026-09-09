using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Identity;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FattoVirtual.Api.Services;

/// <summary>
/// Resolve rótulo/rota e ACL para vínculos polimórficos (financeiro, chat, etc.).
/// Kinds: todo | agenda | sop | sop-run | service | contract | client | payment
/// </summary>
public static class EntityLinkResolver
{
    public static readonly HashSet<string> PaymentLinkKinds = new(StringComparer.OrdinalIgnoreCase)
    {
        "todo", "agenda", "sop", "sop-run", "service", "contract"
    };

    public static async Task<(string Label, string Path)?> ResolveAsync(
        AppDbContext db,
        ClaimsPrincipal user,
        string kind,
        Guid id)
    {
        var orgId = user.GetOrganizationId();
        kind = kind.Trim().ToLowerInvariant();

        switch (kind)
        {
            case "todo":
            {
                if (!user.HasPermission(Permissions.TodosRead) && !user.IsOwner()) return null;
                var t = await db.TodoItems.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                return t is null ? null : (t.Title, "/todos");
            }
            case "agenda":
            {
                if (!user.HasPermission(Permissions.AgendaRead) && !user.IsOwner()) return null;
                var e = await db.AgendaEvents.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                return e is null ? null : (e.Title, "/agenda");
            }
            case "sop":
            {
                if (!user.HasPermission(Permissions.SopsRead) && !user.IsOwner()) return null;
                var s = await db.Sops.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                return s is null ? null : (s.Name, "/procedimentos");
            }
            case "sop-run":
            {
                if (!user.HasPermission(Permissions.SopsRead) && !user.IsOwner()) return null;
                var r = await db.SopRuns.AsNoTracking().Include(x => x.Sop)
                    .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                if (r is null) return null;
                var label = r.Sop?.Name is string n ? $"Execução · {n}" : "Execução de SOP";
                return (label, "/procedimentos");
            }
            case "service":
            {
                if (!user.HasPermission(Permissions.ServicesRead) && !user.IsOwner()) return null;
                var s = await db.ServiceItems.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                return s is null ? null : (s.Title, "/servicos");
            }
            case "contract":
            {
                if (!user.HasPermission(Permissions.ContractsRead) && !user.IsOwner()) return null;
                var c = await db.Contracts.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                if (c is null) return null;
                var path = c.ClientId is Guid cid
                    ? $"/clientes/{cid}"
                    : c.EmployeeId is Guid eid
                        ? $"/prestadores/{eid}"
                        : "/contratos";
                return (c.Name, path);
            }
            case "client":
            {
                if (!user.HasPermission(Permissions.ClientsRead) && !user.IsOwner()) return null;
                var c = await ClientScope.Query(db, user).AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
                return c is null ? null : (c.Name, $"/clientes/{c.Id}");
            }
            case "payment":
            {
                if (!user.HasPermission(Permissions.FinanceOwn) && !user.HasPermission(Permissions.FinanceAll) && !user.IsOwner())
                    return null;
                var p = await db.Payments.AsNoTracking().Include(x => x.Client)
                    .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                if (p is null) return null;
                return ($"{p.Description} · {p.Amount:C}", p.ClientId is Guid cid ? $"/clientes/{cid}" : "/financeiro");
            }
            default:
                return null;
        }
    }
}
