namespace FattoVirtual.Domain.Common;

public interface IOrganizationScoped
{
    Guid OrganizationId { get; set; }
}
