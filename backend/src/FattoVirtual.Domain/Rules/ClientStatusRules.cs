using FattoVirtual.Domain.Enums;

namespace FattoVirtual.Domain.Rules;

public static class ClientStatusRules
{
    public static bool CanTransition(ClientStatus from, ClientStatus to) => (from, to) switch
    {
        (ClientStatus.Active, ClientStatus.Hold) => true,
        (ClientStatus.Active, ClientStatus.Notice) => true,
        (ClientStatus.Hold, ClientStatus.Inactive) => true,
        (ClientStatus.Notice, ClientStatus.Inactive) => true,
        (ClientStatus.Hold, ClientStatus.Active) => true,
        (ClientStatus.Notice, ClientStatus.Active) => true,
        _ when from == to => true,
        _ => false
    };

    public static bool RequiresEmailConfirmation(ClientStatus from, ClientStatus to) =>
        from == ClientStatus.Active && (to == ClientStatus.Hold || to == ClientStatus.Notice);

    public static bool RequiresInactiveChecks(ClientStatus to) => to == ClientStatus.Inactive;
}
