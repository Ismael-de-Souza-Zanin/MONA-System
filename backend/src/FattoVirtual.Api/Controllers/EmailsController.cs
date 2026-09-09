using EmailKit.Abstractions;
using EmailKit.Models;
using FattoVirtual.Domain.Enums;
using FattoVirtual.Domain.Time;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

/// <summary>
/// POC de e-mail: caixa demo do cliente direto + envio programado funcional (EmailKit).
/// Escopo: clientes diretos da organização — nunca clientes-de-clientes.
/// </summary>
[ApiController]
[Authorize]
[Route("api/v1/emails")]
public class EmailsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEmailProviderFactory _factory;

    public EmailsController(AppDbContext db, IEmailProviderFactory factory)
    {
        _db = db;
        _factory = factory;
    }

    [HttpGet("accounts")]
    [RequirePermission(Permissions.EmailsRead)]
    public async Task<IActionResult> Accounts()
    {
        await EnsureDemoAccountsAsync();
        var items = await _db.ClientEmailAccounts
            .Include(a => a.Client)
            .Where(a => a.OrganizationId == User.GetOrganizationId() && a.IsActive)
            .OrderBy(a => a.Client.Name)
            .Select(a => new
            {
                id = a.Id,
                clientId = a.ClientId,
                clientName = a.Client.Name,
                emailAddress = a.EmailAddress,
                displayName = a.DisplayName,
                provider = a.Provider,
                isDemo = a.IsDemo
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("accounts/demo")]
    [RequirePermission(Permissions.EmailsWrite)]
    public async Task<IActionResult> EnsureDemo([FromBody] DemoAccountBody body)
    {
        var client = await ClientScope.Query(_db, User).FirstOrDefaultAsync(c => c.Id == body.ClientId);
        if (client is null) return NotFound(new { detail = "Cliente direto não encontrado." });

        var email = string.IsNullOrWhiteSpace(body.EmailAddress)
            ? (client.Email ?? $"{Slug(client.Name)}@cliente.demo")
            : body.EmailAddress!;

        var existing = await _db.ClientEmailAccounts.FirstOrDefaultAsync(a =>
            a.ClientId == client.Id && a.OrganizationId == User.GetOrganizationId());
        if (existing is null)
        {
            existing = new Domain.Entities.ClientEmailAccount
            {
                OrganizationId = User.GetOrganizationId(),
                ClientId = client.Id,
                EmailAddress = email,
                DisplayName = client.Name,
                Provider = "demo",
                IsDemo = true
            };
            _db.ClientEmailAccounts.Add(existing);
        }
        else
        {
            existing.EmailAddress = email;
            existing.IsActive = true;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return Ok(new { id = existing.Id, clientId = existing.ClientId, emailAddress = existing.EmailAddress, isDemo = existing.IsDemo });
    }

    [HttpGet("mailbox/{accountId:guid}")]
    [RequirePermission(Permissions.EmailsRead)]
    public async Task<IActionResult> Mailbox(Guid accountId, [FromQuery] string folder = "INBOX")
    {
        var account = await _db.ClientEmailAccounts
            .Include(a => a.Client)
            .FirstOrDefaultAsync(a => a.Id == accountId && a.OrganizationId == User.GetOrganizationId());
        if (account is null) return NotFound();

        var mailbox = _factory.GetMailbox(MapKind(account.Provider));
        // Demo sempre disponível mesmo se Gmail/Outlook stub retornar vazio
        if (account.IsDemo || account.Provider is "demo")
            mailbox = _factory.GetMailbox(EmailProviderKind.DevFile);

        var messages = await mailbox.ListAsync(new MailboxQuery
        {
            AccountEmail = account.EmailAddress,
            Folder = folder,
            Take = 50
        });

        return Ok(new
        {
            account = new
            {
                id = account.Id,
                clientId = account.ClientId,
                clientName = account.Client.Name,
                emailAddress = account.EmailAddress,
                provider = account.Provider,
                isDemo = account.IsDemo
            },
            folder,
            messages = messages.Select(m => new
            {
                id = m.ExternalId,
                subject = m.Subject,
                from = m.From.ToString(),
                to = m.To.Select(t => t.ToString()),
                snippet = m.Snippet,
                body = m.TextBody,
                receivedAtUtc = m.ReceivedAtUtc,
                isRead = m.IsRead,
                isOutbound = m.IsOutbound,
                folder = m.Folder
            })
        });
    }

    [HttpGet("scheduled")]
    [RequirePermission(Permissions.EmailsRead)]
    public async Task<IActionResult> Scheduled()
    {
        var prefTz = await EffectiveTzAsync();
        var items = await _db.ScheduledEmails
            .Include(e => e.Client)
            .Where(e => e.OrganizationId == User.GetOrganizationId())
            .OrderByDescending(e => e.ScheduledAtUtc)
            .Take(100)
            .ToListAsync();

        return Ok(items.Select(e => new
        {
            id = e.Id,
            clientId = e.ClientId,
            clientName = e.Client.Name,
            toAddress = e.ToAddress,
            subject = e.Subject,
            body = e.Body,
            status = e.Status,
            scheduledAtUtc = e.ScheduledAtUtc,
            scheduledAtLocal = TimeZoneConvert.FromUtc(e.ScheduledAtUtc, prefTz),
            scheduledInTimeZoneId = e.ScheduledInTimeZoneId,
            displayTimeZoneId = prefTz,
            sentAtUtc = e.SentAtUtc,
            providerKey = e.ProviderKey,
            error = e.Error
        }));
    }

    [HttpPost("schedule")]
    [RequirePermission(Permissions.EmailsSend)]
    public async Task<IActionResult> Schedule([FromBody] ScheduleBody body)
    {
        var client = await ClientScope.Query(_db, User).FirstOrDefaultAsync(c => c.Id == body.ClientId);
        if (client is null) return BadRequest(new { detail = "Somente clientes diretos podem receber e-mail programado." });

        var tz = body.TimeZoneId
            ?? (await EffectiveTzAsync());

        DateTime scheduledUtc;
        if (body.IsUtc == true)
            scheduledUtc = DateTime.SpecifyKind(body.SendAt, DateTimeKind.Utc);
        else
            scheduledUtc = TimeZoneConvert.ToUtc(body.SendAt, tz);

        if (scheduledUtc < DateTime.UtcNow.AddMinutes(-1))
            return BadRequest(new { detail = "Horário de envio já passou." });

        var to = body.ToAddress ?? client.Email;
        if (string.IsNullOrWhiteSpace(to))
            return BadRequest(new { detail = "Informe o e-mail do destinatário (cliente direto)." });

        var account = await _db.ClientEmailAccounts.FirstOrDefaultAsync(a =>
            a.ClientId == client.Id && a.OrganizationId == User.GetOrganizationId());

        var entity = new Domain.Entities.ScheduledEmail
        {
            OrganizationId = User.GetOrganizationId(),
            ClientId = client.Id,
            ClientEmailAccountId = account?.Id,
            CreatedByUserId = User.GetUserId(),
            ToAddress = to!,
            ToName = body.ToName ?? client.Name,
            Subject = body.Subject,
            Body = body.Body,
            IsHtml = body.IsHtml ?? false,
            ScheduledAtUtc = scheduledUtc,
            ScheduledInTimeZoneId = tz,
            Status = "Scheduled",
            ProviderKey = body.Provider ?? "dev-file"
        };
        _db.ScheduledEmails.Add(entity);

        _db.AppNotifications.Add(new Domain.Entities.AppNotification
        {
            OrganizationId = User.GetOrganizationId(),
            UserId = User.GetUserId(),
            Title = "E-mail programado",
            Body = $"Para {client.Name}: {body.Subject} · {TimeZoneConvert.FromUtc(scheduledUtc, tz):g} ({tz})",
            Link = "/emails",
            Type = "email",
            OccursAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return Ok(new
        {
            id = entity.Id,
            status = entity.Status,
            scheduledAtUtc = entity.ScheduledAtUtc,
            scheduledAtLocal = TimeZoneConvert.FromUtc(entity.ScheduledAtUtc, tz),
            timeZoneId = tz
        });
    }

    [HttpPost("schedule/{id:guid}/send-now")]
    [RequirePermission(Permissions.EmailsSend)]
    public async Task<IActionResult> SendNow(Guid id)
    {
        var entity = await _db.ScheduledEmails
            .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == User.GetOrganizationId());
        if (entity is null) return NotFound();
        if (entity.Status is "Sent" or "Cancelled")
            return BadRequest(new { detail = $"Já está {entity.Status}." });

        entity.ScheduledAtUtc = DateTime.UtcNow.AddSeconds(-1);
        entity.Status = "Scheduled";
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, status = "Queued" });
    }

    [HttpPost("schedule/{id:guid}/cancel")]
    [RequirePermission(Permissions.EmailsSend)]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var entity = await _db.ScheduledEmails
            .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == User.GetOrganizationId());
        if (entity is null) return NotFound();
        if (entity.Status != "Scheduled")
            return BadRequest(new { detail = "Só é possível cancelar itens agendados." });
        entity.Status = "Cancelled";
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task EnsureDemoAccountsAsync()
    {
        var orgId = User.GetOrganizationId();
        var clients = await ClientScope.Query(_db, User).Take(5).ToListAsync();
        foreach (var c in clients)
        {
            var has = await _db.ClientEmailAccounts.AnyAsync(a => a.ClientId == c.Id && a.OrganizationId == orgId);
            if (has) continue;
            _db.ClientEmailAccounts.Add(new Domain.Entities.ClientEmailAccount
            {
                OrganizationId = orgId,
                ClientId = c.Id,
                EmailAddress = c.Email ?? $"{Slug(c.Name)}@cliente.demo",
                DisplayName = c.Name,
                Provider = "demo",
                IsDemo = true
            });
        }
        await _db.SaveChangesAsync();
    }

    private async Task<string> EffectiveTzAsync()
    {
        var pref = await _db.UserPreferences.FirstOrDefaultAsync(p =>
            p.UserId == User.GetUserId() && p.OrganizationId == User.GetOrganizationId());
        return pref?.EffectiveTimeZoneId ?? "America/Sao_Paulo";
    }

    private static EmailProviderKind MapKind(string provider) => provider.ToLowerInvariant() switch
    {
        "gmail" => EmailProviderKind.Gmail,
        "outlook" => EmailProviderKind.Outlook,
        "smtp" => EmailProviderKind.Smtp,
        _ => EmailProviderKind.DevFile
    };

    private static string Slug(string name) =>
        new string(name.ToLowerInvariant().Where(char.IsLetterOrDigit).Take(20).ToArray());

    public record DemoAccountBody(Guid ClientId, string? EmailAddress);
    public record ScheduleBody(
        Guid ClientId,
        string Subject,
        string Body,
        DateTime SendAt,
        string? ToAddress,
        string? ToName,
        string? TimeZoneId,
        bool? IsUtc,
        bool? IsHtml,
        string? Provider);
}
