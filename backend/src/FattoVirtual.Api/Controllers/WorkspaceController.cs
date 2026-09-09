using FattoVirtual.Domain.Entities;
using FattoVirtual.Domain.Time;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1")]
public class WorkspaceController : ControllerBase
{
    private readonly AppDbContext _db;

    public WorkspaceController(AppDbContext db) => _db = db;

    [HttpGet("preferences/me")]
    public async Task<IActionResult> GetPreferences()
    {
        var pref = await EnsurePreferenceAsync();
        return Ok(Map(pref));
    }

    [HttpPut("preferences/me")]
    public async Task<IActionResult> UpdatePreferences([FromBody] PreferencesBody body)
    {
        var pref = await EnsurePreferenceAsync();
        if (!string.IsNullOrWhiteSpace(body.TimeZoneId))
            pref.TimeZoneId = body.TimeZoneId;
        if (body.MenuItems is not null)
        {
            pref.MenuItems = body.MenuItems
                .Select(m => new MenuItemPreference
                {
                    Key = m.Key,
                    Visible = m.Visible,
                    CustomLabel = m.CustomLabel
                })
                .ToList();
        }
        pref.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(Map(pref));
    }

    /// <summary>
    /// Atualiza fuso detectado pelo dispositivo e/ou modo viagem.
    /// Evita confusão quando a assistente viaja (casa ≠ local atual).
    /// </summary>
    [HttpPut("preferences/me/travel")]
    public async Task<IActionResult> UpdateTravel([FromBody] TravelBody body)
    {
        var pref = await EnsurePreferenceAsync();
        if (!string.IsNullOrWhiteSpace(body.DetectedTimeZoneId))
            pref.DetectedTimeZoneId = body.DetectedTimeZoneId;

        if (body.TravelModeEnabled.HasValue)
            pref.TravelModeEnabled = body.TravelModeEnabled.Value;

        if (body.TravelTimeZoneId is not null)
            pref.TravelTimeZoneId = string.IsNullOrWhiteSpace(body.TravelTimeZoneId)
                ? null
                : body.TravelTimeZoneId;

        if (body.TravelLabel is not null)
            pref.TravelLabel = body.TravelLabel;

        if (body.ClearTravelEndsAt == true)
            pref.TravelEndsAtUtc = null;
        else if (body.TravelEndsAt.HasValue)
        {
            pref.TravelEndsAtUtc = body.TravelEndsAtIsUtc == true
                ? DateTime.SpecifyKind(body.TravelEndsAt.Value, DateTimeKind.Utc)
                : TimeZoneConvert.ToUtc(body.TravelEndsAt.Value, pref.EffectiveTimeZoneId);
        }

        // Atalho: se detectou fuso diferente da casa e pediu auto-travel
        if (body.AutoEnableTravelWhenDifferent == true
            && !string.IsNullOrWhiteSpace(pref.DetectedTimeZoneId)
            && !string.Equals(pref.DetectedTimeZoneId, pref.TimeZoneId, StringComparison.OrdinalIgnoreCase))
        {
            pref.TravelModeEnabled = true;
            pref.TravelTimeZoneId = pref.DetectedTimeZoneId;
            pref.TravelLabel ??= pref.DetectedTimeZoneId;
        }

        pref.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(Map(pref));
    }

    [HttpGet("timezones")]
    public IActionResult TimeZones() =>
        Ok(TimeZoneConvert.CommonAssistantZones.Select(z => new { id = z, label = z }));

    [HttpGet("notifications")]
    public async Task<IActionResult> Notifications([FromQuery] bool unreadOnly = false)
    {
        var uid = User.GetUserId();
        var q = _db.AppNotifications.Where(n =>
            n.OrganizationId == User.GetOrganizationId() && n.UserId == uid);
        if (unreadOnly) q = q.Where(n => !n.IsRead);

        var items = await q.OrderByDescending(n => n.OccursAtUtc).Take(50).ToListAsync();
        var pref = await EnsurePreferenceAsync();
        var tz = pref.EffectiveTimeZoneId;
        return Ok(items.Select(n => MapNotification(n, tz)));
    }

    [HttpPost("notifications/{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var n = await _db.AppNotifications.FirstOrDefaultAsync(x =>
            x.Id == id && x.UserId == User.GetUserId() && x.OrganizationId == User.GetOrganizationId());
        if (n is null) return NotFound();
        n.IsRead = true;
        n.ViewedAtUtc ??= DateTime.UtcNow;
        n.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("notifications/read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var items = await _db.AppNotifications
            .Where(n => n.UserId == User.GetUserId() && n.OrganizationId == User.GetOrganizationId() && !n.IsRead)
            .ToListAsync();
        foreach (var n in items)
        {
            n.IsRead = true;
            n.ViewedAtUtc ??= DateTime.UtcNow;
            n.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Resolve alerta: Early (antes), OnTime (na hora), Late (atrasado).
    /// </summary>
    [HttpPost("notifications/{id:guid}/resolve")]
    public async Task<IActionResult> Resolve(Guid id, [FromBody] ResolveBody body)
    {
        var allowed = new[] { "Early", "OnTime", "Late" };
        if (string.IsNullOrWhiteSpace(body.Status) || !allowed.Contains(body.Status, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { detail = "Status deve ser Early, OnTime ou Late." });

        var n = await _db.AppNotifications.FirstOrDefaultAsync(x =>
            x.Id == id && x.UserId == User.GetUserId() && x.OrganizationId == User.GetOrganizationId());
        if (n is null) return NotFound();

        n.IsRead = true;
        n.ViewedAtUtc ??= DateTime.UtcNow;
        n.ResolutionStatus = body.Status.Equals("Early", StringComparison.OrdinalIgnoreCase) ? "Early"
            : body.Status.Equals("Late", StringComparison.OrdinalIgnoreCase) ? "Late"
            : "OnTime";
        n.ResolvedAtUtc = DateTime.UtcNow;
        n.ResolvedByUserId = User.GetUserId();
        n.ResolutionNote = body.Note;
        n.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        var pref = await EnsurePreferenceAsync();
        return Ok(MapNotification(n, pref.EffectiveTimeZoneId));
    }

    private async Task<UserPreference> EnsurePreferenceAsync()
    {
        var uid = User.GetUserId();
        var orgId = User.GetOrganizationId();
        var pref = await _db.UserPreferences.FirstOrDefaultAsync(p => p.UserId == uid && p.OrganizationId == orgId);
        if (pref is not null)
        {
            // Auto-expira modo viagem
            if (pref.TravelModeEnabled && pref.TravelEndsAtUtc is not null && pref.TravelEndsAtUtc <= DateTime.UtcNow)
            {
                pref.TravelModeEnabled = false;
                pref.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
            return pref;
        }

        pref = new UserPreference
        {
            OrganizationId = orgId,
            UserId = uid,
            TimeZoneId = "America/Sao_Paulo",
            MenuItems = []
        };
        _db.UserPreferences.Add(pref);
        await _db.SaveChangesAsync();
        return pref;
    }

    private static object Map(UserPreference pref) => new
    {
        timeZoneId = pref.TimeZoneId,
        homeTimeZoneId = pref.TimeZoneId,
        detectedTimeZoneId = pref.DetectedTimeZoneId,
        travelModeEnabled = pref.TravelModeEnabled,
        travelTimeZoneId = pref.TravelTimeZoneId,
        travelLabel = pref.TravelLabel,
        travelEndsAtUtc = pref.TravelEndsAtUtc,
        effectiveTimeZoneId = pref.EffectiveTimeZoneId,
        isAwayFromHome = !string.Equals(pref.EffectiveTimeZoneId, pref.TimeZoneId, StringComparison.OrdinalIgnoreCase),
        menuItems = pref.MenuItems.Select(m => new
        {
            key = m.Key,
            visible = m.Visible,
            customLabel = m.CustomLabel
        })
    };

    private static object MapNotification(Domain.Entities.AppNotification n, string tz) => new
    {
        id = n.Id,
        title = n.Title,
        body = n.Body,
        link = n.Link,
        type = n.Type,
        priority = n.Priority,
        isRead = n.IsRead,
        viewedAtUtc = n.ViewedAtUtc,
        resolutionStatus = n.ResolutionStatus,
        resolvedAtUtc = n.ResolvedAtUtc,
        resolutionNote = n.ResolutionNote,
        occursAtUtc = n.OccursAtUtc,
        occursAtLocal = TimeZoneConvert.FromUtc(n.OccursAtUtc, tz),
        timeZoneId = tz,
        relatedAgendaEventId = n.RelatedAgendaEventId,
        isOpen = n.ResolutionStatus is null
    };

    public record PreferencesBody(string? TimeZoneId, List<MenuItemBody>? MenuItems);
    public record MenuItemBody(string Key, bool Visible, string? CustomLabel);
    public record TravelBody(
        string? DetectedTimeZoneId,
        bool? TravelModeEnabled,
        string? TravelTimeZoneId,
        string? TravelLabel,
        DateTime? TravelEndsAt,
        bool? TravelEndsAtIsUtc,
        bool? ClearTravelEndsAt,
        bool? AutoEnableTravelWhenDifferent);
    public record ResolveBody(string Status, string? Note);
}
