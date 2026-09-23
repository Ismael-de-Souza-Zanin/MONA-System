using System.Security.Claims;
using FattoVirtual.Api.Controllers;
using FattoVirtual.Domain.Entities;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FattoVirtual.Api.Tests;

public sealed class TodoBoardTests : IDisposable
{
    private readonly AppDbContext db = new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private readonly Guid org = Guid.NewGuid();
    private readonly TodoBoardColumn first;
    private readonly TodoBoardColumn second;
    private readonly TodoBoardColumn foreign;

    public TodoBoardTests()
    {
        first = new() { OrganizationId = org, Name = "A fazer", SortOrder = 0 };
        second = new() { OrganizationId = org, Name = "Concluída", SortOrder = 1, MarksComplete = true };
        foreign = new() { OrganizationId = Guid.NewGuid(), Name = "Outra empresa", SortOrder = 9 };
        db.TodoBoardColumns.AddRange(first, second, foreign);
        db.SaveChanges();
    }

    private TodoBoardController Controller() => new(db)
    {
        ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("org_id", org.ToString())], "test"))
            }
        }
    };

    [Fact]
    public async Task PersistsOrderWithoutChangingCompletionOrOtherOrganizations()
    {
        Assert.IsType<OkObjectResult>(await Controller().Reorder(new([second.Id, first.Id])));
        db.ChangeTracker.Clear();
        var ordered = await db.TodoBoardColumns.Where(c => c.OrganizationId == org)
            .OrderBy(c => c.SortOrder).ToListAsync();
        Assert.Equal(new[] { second.Id, first.Id }, ordered.Select(c => c.Id));
        Assert.True(ordered[0].MarksComplete);
        Assert.Equal(9, (await db.TodoBoardColumns.FindAsync(foreign.Id))!.SortOrder);
    }

    [Theory]
    [InlineData("missing")]
    [InlineData("duplicate")]
    [InlineData("foreign")]
    [InlineData("null")]
    public async Task InvalidOrderDoesNotPartiallyMutateColumns(string kind)
    {
        List<Guid>? ids = kind switch
        {
            "missing" => [second.Id],
            "duplicate" => [second.Id, second.Id],
            "foreign" => [second.Id, foreign.Id],
            _ => null
        };
        Assert.IsType<BadRequestObjectResult>(await Controller().Reorder(new(ids)));
        Assert.Equal(0, first.SortOrder);
        Assert.Equal(1, second.SortOrder);
        db.ChangeTracker.Clear();
        Assert.Equal(0, (await db.TodoBoardColumns.FindAsync(first.Id))!.SortOrder);
        Assert.Equal(1, (await db.TodoBoardColumns.FindAsync(second.Id))!.SortOrder);
    }

    public void Dispose() => db.Dispose();
}
