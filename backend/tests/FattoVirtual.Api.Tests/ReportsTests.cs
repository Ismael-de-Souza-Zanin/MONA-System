using System.Security.Claims;
using System.Text.Json;
using FattoVirtual.Api.Controllers;
using FattoVirtual.Domain.Entities;
using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FattoVirtual.Api.Tests;

public sealed class ReportsTests : IDisposable
{
    private readonly AppDbContext db = new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private readonly Guid org = Guid.NewGuid();
    private readonly Guid client = Guid.NewGuid();
    private readonly Guid otherClient = Guid.NewGuid();
    private const string UserId = "va-one";
    private readonly DateTime now = DateTime.UtcNow;

    public ReportsTests()
    {
        db.Clients.AddRange(
            new Client { Id = client, OrganizationId = org, Name = "Cliente permitido", RetainerHoursPerMonth = 10 },
            new Client { Id = otherClient, OrganizationId = org, Name = "Outro cliente", RetainerHoursPerMonth = 99 });
        db.SaveChanges();
    }

    private ReportsController Controller(bool owner = false, bool finance = true)
    {
        var claims = new List<Claim>
        {
            new("sub", UserId), new("org_id", org.ToString()),
            new("is_owner", owner.ToString().ToLowerInvariant()), new("client_id", client.ToString()),
            new("permission", Permissions.Dashboard)
        };
        if (finance) claims.Add(new("permission", Permissions.FinanceOwn));
        return new ReportsController(db)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test")) }
            }
        };
    }

    private static JsonElement Json(IActionResult result) => JsonSerializer.SerializeToElement(
        Assert.IsType<OkObjectResult>(result).Value,
        new JsonSerializerOptions(JsonSerializerDefaults.Web));

    private void Time(Guid? clientId, string userId, int minutes, bool billable = true, DateTime? at = null) =>
        db.TimeEntries.Add(new TimeEntry
        {
            OrganizationId = org, ClientId = clientId, UserId = userId, Minutes = minutes,
            Billable = billable, StartedAtUtc = at ?? now
        });

    private void Todo(Guid? clientId, string userId) => db.TodoItems.Add(new TodoItem
    {
        OrganizationId = org, ClientId = clientId, Title = userId, Status = TodoStatus.Done,
        AssignedUserId = userId, CreatedByUserId = userId, CreatedAt = now, UpdatedAt = now
    });

    [Theory]
    [InlineData("unknown", "week")]
    [InlineData("va", "unknown")]
    public async Task RejectsUnknownLensAndPeriod(string lens, string period) =>
        Assert.IsType<BadRequestObjectResult>(await Controller().Get(lens, period, null));

    [Fact]
    public async Task CannotReadRetainerFromUnassignedOrForeignClient()
    {
        Assert.IsType<NotFoundObjectResult>(await Controller().Get("client", "month", otherClient));
        var foreign = new Client { OrganizationId = Guid.NewGuid(), Name = "Outra empresa", RetainerHoursPerMonth = 700 };
        db.Clients.Add(foreign);
        await db.SaveChangesAsync();
        Assert.IsType<NotFoundObjectResult>(await Controller(owner: true).Get("client", "month", foreign.Id));
    }

    [Fact]
    public async Task SelectedClientExcludesUnlinkedAndOtherClientRecords()
    {
        Time(client, UserId, 30); Time(null, UserId, 100); Time(otherClient, UserId, 200);
        Todo(client, UserId); Todo(null, UserId); Todo(otherClient, UserId);
        db.SopRuns.AddRange(
            new SopRun { OrganizationId = org, ClientId = client, StartedByUserId = UserId, CompletedAtUtc = now },
            new SopRun { OrganizationId = org, StartedByUserId = UserId, CompletedAtUtc = now },
            new SopRun { OrganizationId = org, ClientId = otherClient, StartedByUserId = UserId, CompletedAtUtc = now });
        db.Payments.AddRange(
            new Payment { OrganizationId = org, ClientId = client, Ledger = "Agency", Amount = 100, IsSettled = true, PaidAt = now },
            new Payment { OrganizationId = org, Ledger = "Agency", Amount = 900, IsSettled = true, PaidAt = now });
        await db.SaveChangesAsync();
        var result = Json(await Controller(owner: true).Get("client", "month", client));
        Assert.Equal(30, result.GetProperty("time").GetProperty("minutes").GetInt32());
        Assert.Equal(1, result.GetProperty("todos").GetProperty("done").GetInt32());
        Assert.Equal(1, result.GetProperty("sops").GetProperty("completedRuns").GetInt32());
        Assert.Equal(100, result.GetProperty("money").GetProperty("agency").GetProperty("paid").GetDecimal());
    }

    [Fact]
    public async Task VaSummaryAndPerClientRowsUseTheSamePersonalScope()
    {
        Time(client, UserId, 30); Time(client, "colleague", 120);
        Todo(client, UserId); Todo(client, "colleague");
        db.BusinessDecisions.AddRange(
            new BusinessDecision { OrganizationId = org, ClientId = client, OwnerUserId = UserId, CreatedAt = now },
            new BusinessDecision { OrganizationId = org, ClientId = client, OwnerUserId = "colleague", CreatedAt = now });
        await db.SaveChangesAsync();
        var result = Json(await Controller().Get("va", "month", client));
        var row = result.GetProperty("byClient")[0];
        Assert.Equal(30, row.GetProperty("minutes").GetInt32());
        Assert.Equal(1, row.GetProperty("todosDone").GetInt32());
        Assert.Equal(row.GetProperty("minutes").GetInt32(), result.GetProperty("time").GetProperty("minutes").GetInt32());
        Assert.Equal(1, result.GetProperty("decisions").GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task VaOnlySeesOwnPayoutAndMoneySerializesAsNumbers()
    {
        db.Payments.AddRange(
            new Payment { OrganizationId = org, ClientId = client, TargetUserId = UserId, Ledger = "AssistantPayout", Amount = 75, IsSettled = true, PaidAt = now },
            new Payment { OrganizationId = org, ClientId = client, TargetUserId = "colleague", EmployeeId = Guid.NewGuid(), Ledger = "AssistantPayout", Amount = 800, IsSettled = true, PaidAt = now },
            new Payment { OrganizationId = org, ClientId = client, Ledger = "Agency", Amount = 1500, IsSettled = true, PaidAt = now });
        await db.SaveChangesAsync();
        var money = Json(await Controller().Get("va", "month", null)).GetProperty("money");
        Assert.Equal(75, money.GetProperty("payout").GetProperty("paid").GetDecimal());
        Assert.Equal(0, money.GetProperty("payout").GetProperty("pending").GetDecimal());
        Assert.False(money.TryGetProperty("marginPaid", out _));
        Assert.False(money.TryGetProperty("agency", out _));
        var adminMoney = Json(await Controller(owner: true).Get("adm", "month", null)).GetProperty("money");
        Assert.Equal(625, adminMoney.GetProperty("marginPaid").GetDecimal());
    }

    [Fact]
    public async Task NoFinancePermissionMeansNoMoneyPayload()
    {
        var result = Json(await Controller(finance: false).Get("va", "month", null));
        Assert.Equal(JsonValueKind.Null, result.GetProperty("money").ValueKind);
    }

    [Fact]
    public async Task OwnFinancePermissionDoesNotGrantClientFinanceAccess()
    {
        var result = Json(await Controller().Get("client", "month", client));
        Assert.Equal(JsonValueKind.Null, result.GetProperty("money").ValueKind);
    }

    [Fact]
    public async Task ClientLensHidesInternalDecisionsAndPayout()
    {
        db.BusinessDecisions.AddRange(
            new BusinessDecision { OrganizationId = org, ClientId = client, VisibleToClient = false, CreatedAt = now },
            new BusinessDecision { OrganizationId = org, ClientId = client, VisibleToClient = true, CreatedAt = now });
        await db.SaveChangesAsync();
        var result = Json(await Controller(owner: true).Get("client", "month", client));
        Assert.Equal(1, result.GetProperty("decisions").GetProperty("total").GetInt32());
        Assert.False(result.GetProperty("money").TryGetProperty("payout", out _));
        Assert.False(result.GetProperty("money").TryGetProperty("marginPaid", out _));
    }

    [Fact]
    public async Task WeeklyWindowHasSevenDaysAndExcludesTheNextSunday()
    {
        var nextSunday = now.Date.AddDays(7 - (int)now.DayOfWeek);
        Time(client, UserId, 240, at: nextSunday);
        await db.SaveChangesAsync();
        var result = Json(await Controller().Get("va", "week", client));
        Assert.Equal(TimeSpan.FromDays(7), result.GetProperty("to").GetDateTime() - result.GetProperty("from").GetDateTime());
        Assert.Equal(0, result.GetProperty("time").GetProperty("minutes").GetInt32());
    }

    [Fact]
    public async Task MonthlyRetainerCountsOnlyBillableClientTimeIndependentlyOfReportPeriod()
    {
        Time(client, UserId, 60, at: new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc));
        Time(client, UserId, 120, billable: false);
        Time(null, UserId, 300);
        await db.SaveChangesAsync();
        var result = Json(await Controller().Get("va", "day", null));
        Assert.Equal(1, result.GetProperty("time").GetProperty("retainerUsedHours").GetDecimal());
        Assert.Equal(10, result.GetProperty("time").GetProperty("retainerHours").GetDecimal());
    }

    public void Dispose() => db.Dispose();
}
