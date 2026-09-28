using System.Security.Claims;
using FattoVirtual.Api.Controllers;
using FattoVirtual.Domain.Entities;
using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Identity;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace FattoVirtual.Api.Tests;

public sealed class SettingsUsersTests
{
    [Fact]
    public async Task OwnerCanEditLoginAndEmployeeClientScopeTogether()
    {
        await using var test = await TestContext.CreateAsync();
        var controller = test.Controller();

        var result = await controller.UpdateSharedUser(test.Member.Id, new(
            [test.Client.Id],
            "novo@fattovirtual.com",
            "SenhaNova!2026",
            test.AgentType.Id,
            "Nome atualizado",
            null));

        Assert.IsType<OkObjectResult>(result);
        test.Db.ChangeTracker.Clear();
        var updated = await test.Users.FindByIdAsync(test.Member.Id);
        Assert.NotNull(updated);
        Assert.Equal("Nome atualizado", updated.FullName);
        Assert.Equal("novo@fattovirtual.com", updated.Email);
        Assert.Equal([test.Client.Id], updated.AssignedClientIds);
        Assert.True(await test.Users.CheckPasswordAsync(updated, "SenhaNova!2026"));

        var employee = await test.Db.Employees.SingleAsync(x => x.UserId == test.Member.Id);
        Assert.Equal("Nome atualizado", employee.Name);
        Assert.Equal("novo@fattovirtual.com", employee.Email);
        Assert.True(await test.Db.EmployeeClients.AnyAsync(x =>
            x.EmployeeId == employee.Id && x.ClientId == test.Client.Id));
    }

    [Fact]
    public async Task OwnerCanDeleteLoginWhileEmployeeHistoryIsPreserved()
    {
        await using var test = await TestContext.CreateAsync();
        var employee = await test.Db.Employees.SingleAsync(x => x.UserId == test.Member.Id);
        test.Db.RefreshTokens.Add(new RefreshToken
        {
            UserId = test.Member.Id,
            Token = "refresh-token",
            ExpiresAt = DateTime.UtcNow.AddDays(1)
        });
        await test.Db.SaveChangesAsync();

        var result = await test.Controller().DeleteSharedUser(test.Member.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.Null(await test.Users.FindByIdAsync(test.Member.Id));
        test.Db.ChangeTracker.Clear();
        var preservedEmployee = await test.Db.Employees.FindAsync(employee.Id);
        Assert.NotNull(preservedEmployee);
        Assert.Null(preservedEmployee.UserId);
        Assert.Equal("Inactive", preservedEmployee.Status);
        Assert.False(await test.Db.RefreshTokens.AnyAsync(x => x.UserId == test.Member.Id));
    }

    [Fact]
    public async Task CurrentLoginCannotBeDeleted()
    {
        await using var test = await TestContext.CreateAsync();

        var result = await test.Controller().DeleteSharedUser(test.Owner.Id);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(await test.Users.FindByIdAsync(test.Owner.Id));
    }

    private sealed class TestContext : IAsyncDisposable
    {
        private readonly ServiceProvider provider;

        public AppDbContext Db { get; }
        public UserManager<AppUser> Users { get; }
        public Guid OrganizationId { get; }
        public AppUser Owner { get; }
        public AppUser Member { get; }
        public AccessType AgentType { get; }
        public Client Client { get; }

        private TestContext(
            ServiceProvider provider,
            AppDbContext db,
            UserManager<AppUser> users,
            Guid organizationId,
            AppUser owner,
            AppUser member,
            AccessType agentType,
            Client client)
        {
            this.provider = provider;
            Db = db;
            Users = users;
            OrganizationId = organizationId;
            Owner = owner;
            Member = member;
            AgentType = agentType;
            Client = client;
        }

        public static async Task<TestContext> CreateAsync()
        {
            var services = new ServiceCollection();
            services.AddLogging();
            services.AddDataProtection().UseEphemeralDataProtectionProvider();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(Guid.NewGuid().ToString()));
            services.AddIdentityCore<AppUser>()
                .AddRoles<IdentityRole>()
                .AddEntityFrameworkStores<AppDbContext>()
                .AddDefaultTokenProviders();

            var provider = services.BuildServiceProvider();
            var db = provider.GetRequiredService<AppDbContext>();
            var users = provider.GetRequiredService<UserManager<AppUser>>();
            var organizationId = Guid.NewGuid();
            var ownerType = new AccessType
            {
                OrganizationId = organizationId,
                Name = "Owner",
                IsOwnerType = true,
                Permissions = [Permissions.Settings]
            };
            var agentType = new AccessType
            {
                OrganizationId = organizationId,
                Name = "Agente",
                Permissions = [Permissions.Settings]
            };
            var client = new Client { OrganizationId = organizationId, Name = "Cliente teste" };
            db.Organizations.Add(new Organization { Id = organizationId, Name = "Fatto Virtual" });
            db.AccessTypes.AddRange(ownerType, agentType);
            db.Clients.Add(client);
            await db.SaveChangesAsync();

            var owner = new AppUser
            {
                UserName = "owner@fattovirtual.com",
                Email = "owner@fattovirtual.com",
                FullName = "Owner",
                OrganizationId = organizationId,
                AccessTypeId = ownerType.Id,
                IsOrganizationOwner = true,
                EmailConfirmed = true
            };
            var member = new AppUser
            {
                UserName = "member@fattovirtual.com",
                Email = "member@fattovirtual.com",
                FullName = "Membro",
                OrganizationId = organizationId,
                AccessTypeId = agentType.Id,
                EmailConfirmed = true
            };
            Assert.True((await users.CreateAsync(owner, "Owner!2026")).Succeeded);
            Assert.True((await users.CreateAsync(member, "Member!2026")).Succeeded);
            db.Employees.Add(new Employee
            {
                OrganizationId = organizationId,
                Name = member.FullName,
                Email = member.Email,
                UserId = member.Id,
                Status = "Active"
            });
            await db.SaveChangesAsync();

            return new(provider, db, users, organizationId, owner, member, agentType, client);
        }

        public SettingsController Controller() => new(Db, Users)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim(ClaimTypes.NameIdentifier, Owner.Id),
                        new Claim("org_id", OrganizationId.ToString()),
                        new Claim("is_owner", "true"),
                        new Claim("permission", Permissions.Settings)
                    ], "test"))
                }
            }
        };

        public ValueTask DisposeAsync() => provider.DisposeAsync();
    }
}
