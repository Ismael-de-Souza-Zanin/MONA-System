using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WhatsAppKit.Abstractions;
using WhatsAppKit.Models;

namespace FattoVirtual.Api.Controllers;

/// <summary>
/// POC WhatsApp Fatto — envio via WhatsAppKit (DevFile). Escopo: linha Fatto / clientes diretos.
/// </summary>
[ApiController]
[Authorize]
[Route("api/v1/whatsapp")]
public class WhatsAppController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWhatsAppProviderFactory _factory;

    public WhatsAppController(AppDbContext db, IWhatsAppProviderFactory factory)
    {
        _db = db;
        _factory = factory;
    }

    /// <summary>Status da integração — Ju configura Meta; host já está pronto.</summary>
    [HttpGet("status")]
    [RequirePermission(Permissions.ClientsRead)]
    public IActionResult Status([FromServices] IConfiguration config)
    {
        var metaReady = !string.IsNullOrWhiteSpace(config["WhatsAppKit:Meta:AccessToken"])
                        && !string.IsNullOrWhiteSpace(config["WhatsAppKit:Meta:PhoneNumberId"]);
        return Ok(new
        {
            readyForMeta = true,
            metaCredentialsConfigured = metaReady,
            activeProvider = metaReady ? "MetaCloud" : "DevFile",
            webhookPath = "/api/v1/whatsapp/webhook",
            capabilities = new[]
            {
                "send_text",
                "inbox_poc",
                "webhook_inbound_stub",
                "link_client_phone",
                "notify_assistant_on_send"
            },
            notes = "A Ju conecta o app Meta; o Fatto já expõe send/inbox/webhook e amarra cliente + alertas."
        });
    }

    /// <summary>Webhook Meta (verify + inbound). Pronto para a Ju colar tokens sem mudar o host.</summary>
    [HttpGet("webhook")]
    [AllowAnonymous]
    public IActionResult WebhookVerify(
        [FromQuery(Name = "hub.mode")] string? mode,
        [FromQuery(Name = "hub.verify_token")] string? token,
        [FromQuery(Name = "hub.challenge")] string? challenge,
        [FromServices] IConfiguration config)
    {
        var expected = config["WhatsAppKit:Meta:VerifyToken"];
        if (mode == "subscribe" && !string.IsNullOrWhiteSpace(expected) && token == expected)
            return Content(challenge ?? "", "text/plain");
        return Unauthorized();
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> WebhookInbound([FromBody] object payload, [FromServices] IConfiguration config)
    {
        // Stub: persiste notificação genérica para owner quando houver payload.
        // A Ju implementa o parse Meta completo no WhatsAppKit / aqui.
        var org = await _db.Organizations.OrderBy(o => o.CreatedAt).FirstOrDefaultAsync();
        if (org is not null)
        {
            var owner = await _db.Users.FirstOrDefaultAsync(u =>
                u.OrganizationId == org.Id && u.IsOrganizationOwner);
            if (owner is not null)
            {
                _db.AppNotifications.Add(new Domain.Entities.AppNotification
                {
                    OrganizationId = org.Id,
                    UserId = owner.Id,
                    Title = "WhatsApp inbound (webhook)",
                    Body = "Evento recebido — configure o parse Meta no WhatsAppKit.",
                    Link = "/whatsapp",
                    Type = "whatsapp",
                    OccursAtUtc = DateTime.UtcNow,
                    Priority = "Normal"
                });
                await _db.SaveChangesAsync();
            }
        }
        _ = payload;
        _ = config;
        return Ok(new { received = true });
    }

    [HttpGet("inbox")]
    [RequirePermission(Permissions.ClientsRead)]
    public async Task<IActionResult> Inbox()
    {
        var inbox = _factory.GetInbox(WhatsAppProviderKind.DevFile);
        var messages = await inbox.ListRecentAsync(new WhatsAppInboxQuery { Take = 40 });
        return Ok(messages.Select(m => new
        {
            id = m.ExternalId,
            from = m.FromE164,
            contactName = m.ContactName,
            body = m.Body,
            receivedAtUtc = m.ReceivedAtUtc
        }));
    }

    [HttpPost("send")]
    [RequirePermission(Permissions.ClientsWrite)]
    public async Task<IActionResult> Send([FromBody] SendBody body)
    {
        if (string.IsNullOrWhiteSpace(body.ToE164) || string.IsNullOrWhiteSpace(body.Body))
            return BadRequest(new { detail = "Informe telefone E.164 e mensagem." });

        if (body.ClientId is Guid clientId)
        {
            var ok = await ClientScope.Query(_db, User).AnyAsync(c => c.Id == clientId);
            if (!ok) return BadRequest(new { detail = "Somente clientes diretos." });
        }

        var sender = _factory.GetSender(
            string.Equals(body.Provider, "meta", StringComparison.OrdinalIgnoreCase)
                ? WhatsAppProviderKind.MetaCloud
                : WhatsAppProviderKind.DevFile);

        var result = await sender.SendTextAsync(new WhatsAppTextMessage
        {
            ToE164 = body.ToE164!,
            Body = body.Body!,
            FromDisplayName = "Fatto Virtual",
            TemplateName = body.TemplateName,
            Metadata =
            {
                ["organizationId"] = User.GetOrganizationId().ToString(),
                ["userId"] = User.GetUserId(),
                ["clientId"] = body.ClientId?.ToString() ?? ""
            }
        });

        if (!result.Success)
            return BadRequest(new { detail = result.Error, provider = result.ProviderKey });

        _db.AppNotifications.Add(new Domain.Entities.AppNotification
        {
            OrganizationId = User.GetOrganizationId(),
            UserId = User.GetUserId(),
            Title = "WhatsApp enviado (POC)",
            Body = $"Para {body.ToE164}: {body.Body}",
            Link = "/whatsapp",
            Type = "whatsapp",
            OccursAtUtc = DateTime.UtcNow,
            Priority = "Normal"
        });
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            provider = result.ProviderKey,
            messageId = result.ProviderMessageId
        });
    }

    public record SendBody(string? ToE164, string? Body, Guid? ClientId, string? TemplateName, string? Provider);
}
