namespace FattoVirtual.Application.Common;

public record ApiError(string Message, string? Code = null);

public class PagedResult<T>
{
    public required IReadOnlyList<T> Items { get; init; }
    public int Total { get; init; }
}
