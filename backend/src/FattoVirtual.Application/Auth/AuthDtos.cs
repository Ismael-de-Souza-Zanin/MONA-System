namespace FattoVirtual.Application.Auth;

public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserProfileDto User);

public record UserProfileDto(
    string Id,
    string FullName,
    string Email,
    Guid OrganizationId,
    bool IsOwner,
    Guid? AccessTypeId,
    IReadOnlyList<string> Permissions,
    IReadOnlyList<Guid> AssignedClientIds);

public record RegisterSharedUserRequest(
    string FullName,
    string Email,
    string Password,
    Guid AccessTypeId,
    List<Guid> AssignedClientIds);

public record UpdateProfileRequest(string FullName, string? Phone);
