using EmailKit.Abstractions;
using EmailKit.Models;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FattoVirtual.Infrastructure.Services;

/// <summary>
/// Dispara e-mails programados via EmailKit (POC funcional com DevFile).
/// </summary>
public sealed class ScheduledEmailBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ScheduledEmailBackgroundService> _logger;

    public ScheduledEmailBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<ScheduledEmailBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessDueAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Scheduled email worker failed");
            }

            await Task.Delay(TimeSpan.FromSeconds(20), stoppingToken);
        }
    }

    private async Task ProcessDueAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var factory = scope.ServiceProvider.GetRequiredService<IEmailProviderFactory>();
        var now = DateTime.UtcNow;

        var due = await db.ScheduledEmails
            .Include(e => e.Client)
            .Where(e => e.Status == "Scheduled" && e.ScheduledAtUtc <= now)
            .OrderBy(e => e.ScheduledAtUtc)
            .Take(20)
            .ToListAsync(ct);

        foreach (var item in due)
        {
            var kind = item.ProviderKey?.ToLowerInvariant() switch
            {
                "smtp" => EmailProviderKind.Smtp,
                "gmail" => EmailProviderKind.Gmail,
                "outlook" => EmailProviderKind.Outlook,
                _ => EmailProviderKind.DevFile
            };

            var sender = factory.GetSender(kind);
            var result = await sender.SendAsync(new EmailMessage
            {
                From = new EmailAddress("assistente@fattovirtual.com", "Fatto Virtual"),
                To = [new EmailAddress(item.ToAddress, item.ToName)],
                Subject = item.Subject,
                TextBody = item.IsHtml ? null : item.Body,
                HtmlBody = item.IsHtml ? item.Body : null,
                ScheduledAtUtc = item.ScheduledAtUtc
            }, ct);

            if (result.Success)
            {
                item.Status = "Sent";
                item.SentAtUtc = DateTime.UtcNow;
                item.ProviderKey = result.ProviderKey;
                item.ProviderMessageId = result.ProviderMessageId;
                item.Error = null;
                _logger.LogInformation("Scheduled email {Id} sent via {Provider}", item.Id, result.ProviderKey);
            }
            else
            {
                item.Status = "Failed";
                item.Error = result.Error;
                item.ProviderKey = result.ProviderKey;
                _logger.LogWarning("Scheduled email {Id} failed: {Error}", item.Id, result.Error);
            }
            item.UpdatedAt = DateTime.UtcNow;
        }

        if (due.Count > 0)
            await db.SaveChangesAsync(ct);
    }
}
