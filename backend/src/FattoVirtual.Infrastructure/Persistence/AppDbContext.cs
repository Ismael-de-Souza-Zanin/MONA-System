using System.Text.Json;
using FattoVirtual.Domain.Entities;
using FattoVirtual.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace FattoVirtual.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<AccessType> AccessTypes => Set<AccessType>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ClientTopic> ClientTopics => Set<ClientTopic>();
    public DbSet<ClientLink> ClientLinks => Set<ClientLink>();
    public DbSet<ClientCredential> ClientCredentials => Set<ClientCredential>();
    public DbSet<ClientApp> ClientApps => Set<ClientApp>();
    public DbSet<ClientCrmEntry> ClientCrmEntries => Set<ClientCrmEntry>();
    public DbSet<ClientDocument> ClientDocuments => Set<ClientDocument>();
    public DbSet<ClientPortalMessage> ClientPortalMessages => Set<ClientPortalMessage>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<EmployeeClient> EmployeeClients => Set<EmployeeClient>();
    public DbSet<EmployeeScheduleDay> EmployeeScheduleDays => Set<EmployeeScheduleDay>();
    public DbSet<PartnerCompany> PartnerCompanies => Set<PartnerCompany>();
    public DbSet<ClientPartner> ClientPartners => Set<ClientPartner>();
    public DbSet<ServiceItem> ServiceItems => Set<ServiceItem>();
    public DbSet<ClientService> ClientServices => Set<ClientService>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<OnboardingItem> OnboardingItems => Set<OnboardingItem>();
    public DbSet<ChecklistTemplate> ChecklistTemplates => Set<ChecklistTemplate>();
    public DbSet<AgendaCategory> AgendaCategories => Set<AgendaCategory>();
    public DbSet<AgendaEvent> AgendaEvents => Set<AgendaEvent>();
    public DbSet<AppCatalogItem> AppCatalogItems => Set<AppCatalogItem>();
    public DbSet<Sop> Sops => Set<Sop>();
    public DbSet<SopScript> SopScripts => Set<SopScript>();
    public DbSet<SopStep> SopSteps => Set<SopStep>();
    public DbSet<SopRun> SopRuns => Set<SopRun>();
    public DbSet<SopRunStep> SopRunSteps => Set<SopRunStep>();
    public DbSet<SopOverlay> SopOverlays => Set<SopOverlay>();
    public DbSet<TodoItem> TodoItems => Set<TodoItem>();
    public DbSet<TodoBoardColumn> TodoBoardColumns => Set<TodoBoardColumn>();
    public DbSet<TodoComment> TodoComments => Set<TodoComment>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PaymentLink> PaymentLinks => Set<PaymentLink>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<ShareLink> ShareLinks => Set<ShareLink>();
    public DbSet<FaqItem> FaqItems => Set<FaqItem>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserPreference> UserPreferences => Set<UserPreference>();
    public DbSet<AppNotification> AppNotifications => Set<AppNotification>();
    public DbSet<ClientEmailAccount> ClientEmailAccounts => Set<ClientEmailAccount>();
    public DbSet<ScheduledEmail> ScheduledEmails => Set<ScheduledEmail>();
    public DbSet<ChatThread> ChatThreads => Set<ChatThread>();
    public DbSet<ChatParticipant> ChatParticipants => Set<ChatParticipant>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ClientGroup> ClientGroups => Set<ClientGroup>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        var stringListComparer = new ValueComparer<List<string>>(
            (a, b) => a!.SequenceEqual(b!),
            c => c.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
            c => c.ToList());

        var guidListComparer = new ValueComparer<List<Guid>>(
            (a, b) => a!.SequenceEqual(b!),
            c => c.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
            c => c.ToList());

        var menuComparer = new ValueComparer<List<MenuItemPreference>>(
            (a, b) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(b, (JsonSerializerOptions?)null),
            c => JsonSerializer.Serialize(c, (JsonSerializerOptions?)null).GetHashCode(),
            c => JsonSerializer.Deserialize<List<MenuItemPreference>>(
                     JsonSerializer.Serialize(c, (JsonSerializerOptions?)null),
                     (JsonSerializerOptions?)null) ?? new List<MenuItemPreference>());

        builder.Entity<AccessType>()
            .Property(x => x.Permissions)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>())
            .Metadata.SetValueComparer(stringListComparer);

        builder.Entity<ChecklistTemplate>()
            .Property(x => x.Items)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>())
            .Metadata.SetValueComparer(stringListComparer);

        builder.Entity<Sop>()
            .Property(x => x.Tags)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>())
            .Metadata.SetValueComparer(stringListComparer);

        builder.Entity<Sop>()
            .Property(x => x.SituationAliases)
            .HasConversion(
                v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
                v => DeserializeStringList(v))
            .Metadata.SetValueComparer(stringListComparer);

        builder.Entity<Sop>()
            .HasOne(s => s.ServiceItem)
            .WithMany()
            .HasForeignKey(s => s.ServiceItemId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<SopOverlay>()
            .HasOne(o => o.Sop)
            .WithMany(s => s.Overlays)
            .HasForeignKey(o => o.SopId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<SopRun>()
            .HasOne(r => r.AgendaEvent)
            .WithMany()
            .HasForeignKey(r => r.AgendaEventId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<SopRun>()
            .HasOne(r => r.TodoItem)
            .WithMany()
            .HasForeignKey(r => r.TodoItemId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Client>()
            .Property(x => x.ServiceScopes)
            .HasConversion(
                v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
                v => DeserializeStringList(v))
            .Metadata.SetValueComparer(stringListComparer);

        builder.Entity<Client>()
            .Property(x => x.Tags)
            .HasConversion(
                v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
                v => DeserializeStringList(v))
            .Metadata.SetValueComparer(stringListComparer);

        builder.Entity<Client>()
            .HasOne(c => c.ClientGroup)
            .WithMany(g => g.Clients)
            .HasForeignKey(c => c.ClientGroupId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<ClientGroup>()
            .HasIndex(x => new { x.OrganizationId, x.Name });

        builder.Entity<Client>().HasIndex(x => new { x.OrganizationId, x.ClientGroupId });

        builder.Entity<ClientCrmEntry>()
            .HasOne(e => e.Client)
            .WithMany(c => c.CrmEntries)
            .HasForeignKey(e => e.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ClientCrmEntry>()
            .HasIndex(x => new { x.ClientId, x.CreatedAt });

        builder.Entity<ClientDocument>()
            .HasOne(d => d.Client)
            .WithMany(c => c.Documents)
            .HasForeignKey(d => d.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ClientPortalMessage>()
            .HasOne(m => m.Client)
            .WithMany(c => c.PortalMessages)
            .HasForeignKey(m => m.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Payment>()
            .HasOne(p => p.Invoice)
            .WithMany()
            .HasForeignKey(p => p.InvoiceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Payment>()
            .HasIndex(x => new { x.OrganizationId, x.ClientId, x.Ledger });

        builder.Entity<TodoItem>()
            .Property(x => x.Tags)
            .HasConversion(
                v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
                v => DeserializeStringList(v))
            .Metadata.SetValueComparer(stringListComparer);

        builder.Entity<TodoItem>()
            .HasOne(t => t.BoardColumn)
            .WithMany(c => c.Todos)
            .HasForeignKey(t => t.BoardColumnId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<TodoBoardColumn>()
            .HasIndex(x => new { x.OrganizationId, x.SortOrder });

        builder.Entity<ServiceItem>()
            .Property(x => x.Specificities)
            .HasConversion(
                v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
                v => DeserializeStringList(v))
            .Metadata.SetValueComparer(stringListComparer);

        builder.Entity<ClientService>()
            .HasIndex(x => new { x.ClientId, x.ServiceItemId })
            .IsUnique();

        builder.Entity<ClientService>()
            .HasOne(x => x.ServiceItem)
            .WithMany(s => s.ClientLinks)
            .HasForeignKey(x => x.ServiceItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<AppNotification>()
            .HasOne(n => n.RelatedTodoItem)
            .WithMany()
            .HasForeignKey(n => n.RelatedTodoItemId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<AppUser>()
            .Property(x => x.AssignedClientIds)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions?)null) ?? new List<Guid>())
            .Metadata.SetValueComparer(guidListComparer);

        builder.Entity<Employee>()
            .HasOne(x => x.Manager)
            .WithMany(x => x.Reports)
            .HasForeignKey(x => x.ManagerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<EmployeeClient>()
            .HasIndex(x => new { x.EmployeeId, x.ClientId })
            .IsUnique();

        builder.Entity<ClientPartner>()
            .HasIndex(x => new { x.ClientId, x.PartnerCompanyId })
            .IsUnique();
        builder.Entity<ClientPartner>()
            .HasOne(x => x.PartnerCompany)
            .WithMany(x => x.ClientLinks)
            .HasForeignKey(x => x.PartnerCompanyId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ClientPartner>()
            .HasOne(x => x.Client)
            .WithMany()
            .HasForeignKey(x => x.ClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<FaqItem>()
            .HasIndex(x => new { x.OrganizationId, x.SortOrder });

        builder.Entity<PaymentLink>()
            .HasOne(l => l.Payment)
            .WithMany(p => p.Links)
            .HasForeignKey(l => l.PaymentId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<PaymentLink>()
            .HasIndex(x => new { x.PaymentId, x.EntityKind, x.EntityId })
            .IsUnique();
        builder.Entity<PaymentLink>()
            .HasIndex(x => new { x.EntityKind, x.EntityId });

        builder.Entity<Client>().HasIndex(x => new { x.OrganizationId, x.Name });
        builder.Entity<ShareLink>().HasIndex(x => x.Token).IsUnique();

        builder.Entity<UserPreference>()
            .Property(x => x.MenuItems)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<MenuItemPreference>>(v, (JsonSerializerOptions?)null) ?? new List<MenuItemPreference>())
            .Metadata.SetValueComparer(menuComparer);

        builder.Entity<UserPreference>()
            .HasIndex(x => new { x.OrganizationId, x.UserId })
            .IsUnique();

        builder.Entity<AppNotification>()
            .HasIndex(x => new { x.UserId, x.IsRead, x.OccursAtUtc });

        builder.Entity<TodoItem>()
            .HasOne(t => t.AgendaEvent)
            .WithMany(e => e.LinkedTodos)
            .HasForeignKey(t => t.AgendaEventId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<SopStep>()
            .HasOne(s => s.Sop)
            .WithMany(s => s.Steps)
            .HasForeignKey(s => s.SopId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<SopRun>()
            .HasOne(r => r.Sop)
            .WithMany(s => s.Runs)
            .HasForeignKey(r => r.SopId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ClientEmailAccount>()
            .HasIndex(x => new { x.OrganizationId, x.ClientId, x.EmailAddress });

        builder.Entity<ScheduledEmail>()
            .HasIndex(x => new { x.Status, x.ScheduledAtUtc });
    }

    private static List<string> DeserializeStringList(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return new List<string>();
        try
        {
            return JsonSerializer.Deserialize<List<string>>(value, (JsonSerializerOptions?)null) ?? new List<string>();
        }
        catch (JsonException)
        {
            return new List<string>();
        }
    }
}
