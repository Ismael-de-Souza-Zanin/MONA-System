using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Identity;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/chat")]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _users;

    public ChatController(AppDbContext db, UserManager<AppUser> users)
    {
        _db = db;
        _users = users;
    }

    [HttpGet("threads")]
    public async Task<IActionResult> Threads()
    {
        var uid = User.GetUserId();
        var orgId = User.GetOrganizationId();
        var threadIds = await _db.ChatParticipants
            .Where(p => p.UserId == uid)
            .Select(p => p.ThreadId)
            .ToListAsync();

        var threads = await _db.ChatThreads
            .Include(t => t.Messages)
            .Include(t => t.Participants)
            .Where(t => t.OrganizationId == orgId && threadIds.Contains(t.Id))
            .OrderByDescending(t => t.UpdatedAt ?? t.CreatedAt)
            .ToListAsync();

        var names = await _db.Users.Where(u => u.OrganizationId == orgId)
            .ToDictionaryAsync(u => u.Id, u => u.FullName);

        return Ok(threads.Select(t =>
        {
            var last = t.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();
            return new
            {
                id = t.Id,
                title = t.Title,
                isDirect = t.IsDirect,
                isSelf = t.IsSelf,
                isGroup = !t.IsDirect && !t.IsSelf,
                clientId = t.ClientId,
                lastMessage = last?.Body,
                lastAt = last?.CreatedAt ?? t.CreatedAt,
                participants = t.Participants.Select(p => new
                {
                    userId = p.UserId,
                    name = names.GetValueOrDefault(p.UserId, "Usuário")
                })
            };
        }));
    }

    [HttpPost("threads")]
    public async Task<IActionResult> CreateThread([FromBody] CreateThreadBody body)
    {
        var orgId = User.GetOrganizationId();
        var uid = User.GetUserId();

        // Chat consigo (notas pessoais)
        if (body.Self == true || string.Equals(body.PeerUserId, uid, StringComparison.Ordinal))
        {
            var existingSelf = await _db.ChatThreads
                .Include(t => t.Participants)
                .FirstOrDefaultAsync(t =>
                    t.OrganizationId == orgId && t.IsSelf &&
                    t.Participants.Any(p => p.UserId == uid));
            if (existingSelf is not null)
                return Ok(new { id = existingSelf.Id, title = existingSelf.Title, isSelf = true });

            var selfThread = new Domain.Entities.ChatThread
            {
                OrganizationId = orgId,
                Title = body.Title ?? "Notas (eu)",
                IsDirect = true,
                IsSelf = true,
                Participants = [new Domain.Entities.ChatParticipant { UserId = uid }]
            };
            _db.ChatThreads.Add(selfThread);
            await _db.SaveChangesAsync();
            return Ok(new { id = selfThread.Id, title = selfThread.Title, isSelf = true });
        }

        // Grupo
        if (body.ParticipantUserIds is { Count: > 0 } || body.IsGroup == true)
        {
            var ids = (body.ParticipantUserIds ?? [])
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();
            if (!ids.Contains(uid)) ids.Add(uid);
            if (ids.Count < 2)
                return BadRequest(new { detail = "Grupo precisa de ao menos outra pessoa." });

            var valid = await _db.Users.Where(u => u.OrganizationId == orgId && ids.Contains(u.Id))
                .Select(u => u.Id).ToListAsync();
            if (valid.Count != ids.Count)
                return BadRequest(new { detail = "Participante inválido." });

            var names = await _db.Users.Where(u => valid.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName);
            var title = body.Title ?? "Grupo · " + string.Join(", ", valid.Where(id => id != uid).Take(3).Select(id => names.GetValueOrDefault(id, "?")));

            var group = new Domain.Entities.ChatThread
            {
                OrganizationId = orgId,
                Title = title,
                IsDirect = false,
                IsSelf = false,
                ClientId = body.ClientId,
                Participants = valid.Select(id => new Domain.Entities.ChatParticipant { UserId = id }).ToList()
            };
            _db.ChatThreads.Add(group);
            await _db.SaveChangesAsync();
            return Ok(new { id = group.Id, title = group.Title, isGroup = true });
        }

        if (string.IsNullOrWhiteSpace(body.PeerUserId))
            return BadRequest(new { detail = "Informe a pessoa, grupo ou chat consigo." });

        var peer = await _users.Users.FirstOrDefaultAsync(u =>
            u.Id == body.PeerUserId && u.OrganizationId == orgId);
        if (peer is null) return BadRequest(new { detail = "Usuário não encontrado na organização." });

        var existing = await _db.ChatThreads
            .Include(t => t.Participants)
            .Where(t => t.OrganizationId == orgId && t.IsDirect && !t.IsSelf)
            .FirstOrDefaultAsync(t =>
                t.Participants.Count == 2 &&
                t.Participants.Any(p => p.UserId == uid) &&
                t.Participants.Any(p => p.UserId == body.PeerUserId));

        if (existing is not null)
            return Ok(new { id = existing.Id, title = existing.Title });

        var thread = new Domain.Entities.ChatThread
        {
            OrganizationId = orgId,
            Title = body.Title ?? $"Chat · {peer.FullName}",
            IsDirect = true,
            ClientId = body.ClientId,
            Participants =
            [
                new Domain.Entities.ChatParticipant { UserId = uid },
                new Domain.Entities.ChatParticipant { UserId = peer.Id }
            ]
        };
        _db.ChatThreads.Add(thread);
        await _db.SaveChangesAsync();
        return Ok(new { id = thread.Id, title = thread.Title });
    }

    [HttpGet("threads/{id:guid}/messages")]
    public async Task<IActionResult> Messages(Guid id)
    {
        if (!await IsParticipant(id)) return NotFound();
        var names = await _db.Users.Where(u => u.OrganizationId == User.GetOrganizationId())
            .ToDictionaryAsync(u => u.Id, u => u.FullName);
        var items = await _db.ChatMessages
            .Where(m => m.ThreadId == id)
            .OrderBy(m => m.CreatedAt)
            .Take(200)
            .ToListAsync();
        return Ok(items.Select(m => new
        {
            id = m.Id,
            body = m.Body,
            authorUserId = m.AuthorUserId,
            authorName = names.GetValueOrDefault(m.AuthorUserId, "Usuário"),
            channel = m.Channel,
            attachmentKind = m.AttachmentKind,
            attachmentId = m.AttachmentId,
            attachmentLabel = m.AttachmentLabel,
            attachmentPath = m.AttachmentPath,
            createdAt = m.CreatedAt,
            mine = m.AuthorUserId == User.GetUserId()
        }));
    }

    [HttpPost("threads/{id:guid}/messages")]
    public async Task<IActionResult> Send(Guid id, [FromBody] SendBody body)
    {
        if (!await IsParticipant(id)) return NotFound();
        if (string.IsNullOrWhiteSpace(body.Body) && string.IsNullOrWhiteSpace(body.AttachmentKind))
            return BadRequest(new { detail = "Mensagem vazia." });

        var kind = string.IsNullOrWhiteSpace(body.AttachmentKind) ? "none" : body.AttachmentKind!.Trim().ToLowerInvariant();
        string? label = null;
        string? path = null;
        Guid? attachmentId = body.AttachmentId;

        if (kind != "none" && attachmentId is Guid aid)
        {
            var resolved = await ResolveAttachmentAsync(kind, aid);
            if (resolved is null)
                return StatusCode(403, new { detail = "Sem acesso a este recurso para compartilhar." });
            label = resolved.Value.Label;
            path = resolved.Value.Path;
        }
        else
        {
            kind = "none";
            attachmentId = null;
        }

        var text = string.IsNullOrWhiteSpace(body.Body)
            ? (label is null ? "" : $"📎 {label}")
            : body.Body.Trim();

        var msg = new Domain.Entities.ChatMessage
        {
            ThreadId = id,
            AuthorUserId = User.GetUserId(),
            Body = text,
            Channel = "internal",
            AttachmentKind = kind,
            AttachmentId = attachmentId,
            AttachmentLabel = label,
            AttachmentPath = path
        };
        _db.ChatMessages.Add(msg);
        var thread = await _db.ChatThreads.FirstAsync(t => t.Id == id);
        thread.UpdatedAt = DateTime.UtcNow;

        var peers = await _db.ChatParticipants
            .Where(p => p.ThreadId == id && p.UserId != User.GetUserId())
            .Select(p => p.UserId)
            .ToListAsync();
        foreach (var peerId in peers)
        {
            _db.AppNotifications.Add(new Domain.Entities.AppNotification
            {
                OrganizationId = User.GetOrganizationId(),
                UserId = peerId,
                Title = "Nova mensagem no chat",
                Body = text.Length > 80 ? text[..80] + "…" : text,
                Link = "/chat",
                Type = "chat",
                OccursAtUtc = DateTime.UtcNow,
                Priority = "Normal"
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new
        {
            id = msg.Id,
            createdAt = msg.CreatedAt,
            attachmentKind = msg.AttachmentKind,
            attachmentLabel = msg.AttachmentLabel,
            attachmentPath = msg.AttachmentPath
        });
    }

    [HttpGet("peers")]
    public async Task<IActionResult> Peers()
    {
        var uid = User.GetUserId();
        var users = await _db.Users
            .Where(u => u.OrganizationId == User.GetOrganizationId())
            .OrderBy(u => u.FullName)
            .Select(u => new { id = u.Id, name = u.FullName, email = u.Email, isSelf = u.Id == uid })
            .ToListAsync();
        return Ok(users);
    }

    private async Task<(string Label, string Path)?> ResolveAttachmentAsync(string kind, Guid id)
    {
        var orgId = User.GetOrganizationId();
        switch (kind)
        {
            case "client":
            {
                if (!User.HasPermission(Permissions.ClientsRead) && !User.IsOwner()) return null;
                var c = await ClientScope.Query(_db, User).FirstOrDefaultAsync(x => x.Id == id);
                return c is null ? null : (c.Name, $"/clientes/{c.Id}");
            }
            case "service":
            {
                if (!User.HasPermission(Permissions.ServicesRead) && !User.IsOwner()) return null;
                var s = await _db.ServiceItems.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                return s is null ? null : (s.Title, "/servicos");
            }
            case "todo":
            {
                if (!User.HasPermission(Permissions.TodosRead) && !User.IsOwner()) return null;
                var t = await _db.TodoItems.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                return t is null ? null : (t.Title, "/todos");
            }
            case "agenda":
            {
                if (!User.HasPermission(Permissions.AgendaRead) && !User.IsOwner()) return null;
                var e = await _db.AgendaEvents.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                return e is null ? null : (e.Title, "/agenda");
            }
            case "payment":
            {
                if (!User.HasPermission(Permissions.FinanceOwn) && !User.HasPermission(Permissions.FinanceAll) && !User.IsOwner())
                    return null;
                var p = await _db.Payments.Include(x => x.Client)
                    .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                if (p is null) return null;
                var label = $"{p.Description} · {p.Amount:C}";
                return (label, p.ClientId is Guid cid ? $"/clientes/{cid}" : "/financeiro");
            }
            case "contract":
            {
                if (!User.HasPermission(Permissions.ContractsRead) && !User.IsOwner()) return null;
                var ct = await _db.Contracts.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
                return ct is null ? null : (ct.Name, "/contratos");
            }
            default:
                return null;
        }
    }

    private async Task<bool> IsParticipant(Guid threadId) =>
        await _db.ChatParticipants.AnyAsync(p =>
            p.ThreadId == threadId && p.UserId == User.GetUserId());

    public record CreateThreadBody(
        string? PeerUserId,
        string? Title,
        Guid? ClientId,
        bool? Self,
        bool? IsGroup,
        List<string>? ParticipantUserIds);
    public record SendBody(string? Body, string? AttachmentKind, Guid? AttachmentId);
}
