using Microsoft.AspNetCore.Identity;

namespace FattoVirtual.Infrastructure.Identity;

public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public Guid? AccessTypeId { get; set; }
    public bool IsOrganizationOwner { get; set; }
    public List<Guid> AssignedClientIds { get; set; } = [];
}
