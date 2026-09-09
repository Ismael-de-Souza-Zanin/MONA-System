using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FattoVirtual.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/sops")]
public class SopsController : ControllerBase
{
    private readonly AppDbContext _db;
    public SopsController(AppDbContext db) => _db = db;

    /// <summary>Hub: continuar, frequentes, áreas, situações rápidas.</summary>
    [HttpGet("hub")]
    [RequirePermission(Permissions.SopsRead)]
    public async Task<IActionResult> Hub()
    {
        var orgId = User.GetOrganizationId();
        var uid = User.GetUserId();

        var continueRaw = await _db.SopRuns
            .Include(r => r.Sop)
            .Include(r => r.Client)
            .Include(r => r.Steps)
            .Where(r => r.OrganizationId == orgId && r.StartedByUserId == uid && r.Status == "InProgress")
            .OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt)
            .Take(3)
            .ToListAsync();
        var continueRuns = continueRaw.Select(r =>
        {
            var total = r.Steps.Count;
            var done = r.Steps.Count(s => s.IsCompleted);
            return new
            {
                id = r.Id,
                sopId = r.SopId,
                sopName = r.Sop.Name,
                clientName = r.Client?.Name,
                progress = total == 0 ? 0 : (int)Math.Round(100.0 * done / total),
                startedAt = r.CreatedAt
            };
        }).ToList();

        var since = DateTime.UtcNow.AddDays(-90);
        var freqIds = await _db.SopRuns
            .Where(r => r.OrganizationId == orgId && r.CreatedAt >= since)
            .GroupBy(r => r.SopId)
            .Select(g => new { sopId = g.Key, runs = g.Count() })
            .OrderByDescending(x => x.runs)
            .Take(6)
            .ToListAsync();

        List<object> frequent;
        if (freqIds.Count > 0)
        {
            var ids = freqIds.Select(f => f.sopId).ToList();
            var sops = await _db.Sops.Where(s => ids.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
            frequent = freqIds
                .Where(f => sops.ContainsKey(f.sopId))
                .Select(f => (object)new
                {
                    sopId = f.sopId,
                    name = sops[f.sopId].Name,
                    procedureType = sops[f.sopId].ProcedureType,
                    category = sops[f.sopId].Category,
                    runs = f.runs
                })
                .ToList();
        }
        else
        {
            var starters = await _db.Sops.Where(s => s.OrganizationId == orgId)
                .OrderBy(s => s.Name)
                .Take(6)
                .Select(s => new { sopId = s.Id, name = s.Name, procedureType = s.ProcedureType, category = s.Category, runs = 0 })
                .ToListAsync();
            frequent = starters.Cast<object>().ToList();
        }

        var areas = await _db.Sops.Where(s => s.OrganizationId == orgId)
            .GroupBy(s => string.IsNullOrWhiteSpace(s.Category) ? "Geral" : s.Category)
            .Select(g => new { area = g.Key, count = g.Count() })
            .OrderBy(x => x.area)
            .ToListAsync();

        var situations = await _db.Sops.Where(s => s.OrganizationId == orgId)
            .Select(s => new { s.Id, s.Name, s.TriggerDescription, aliases = s.SituationAliases })
            .ToListAsync();

        var chips = situations
            .SelectMany(s =>
            {
                var list = new List<(Guid Id, string Label, string Name)>();
                if (!string.IsNullOrWhiteSpace(s.TriggerDescription))
                    list.Add((s.Id, s.TriggerDescription, s.Name));
                foreach (var a in s.aliases.Take(2))
                    list.Add((s.Id, a, s.Name));
                return list;
            })
            .GroupBy(x => x.Label.ToLowerInvariant())
            .Select(g => g.First())
            .Take(8)
            .Select(x => new { sopId = x.Id, label = x.Label, sopName = x.Name })
            .ToList();

        return Ok(new { continueRuns, frequent, areas, situations = chips });
    }

    [HttpGet("metrics")]
    [RequirePermission(Permissions.SopsRead)]
    public async Task<IActionResult> Metrics([FromQuery] int days = 30)
    {
        var orgId = User.GetOrganizationId();
        days = Math.Clamp(days, 7, 365);
        var since = DateTime.UtcNow.AddDays(-days);
        var runs = await _db.SopRuns.Include(r => r.Sop)
            .Where(r => r.OrganizationId == orgId && r.CreatedAt >= since)
            .ToListAsync();

        var completed = runs.Where(r => r.Status == "Completed").ToList();
        var bySop = runs.GroupBy(r => r.SopId).Select(g =>
        {
            var done = g.Where(r => r.Status == "Completed").ToList();
            var avgHours = done.Count == 0
                ? (double?)null
                : done.Average(r => ((r.CompletedAtUtc ?? r.UpdatedAt ?? r.CreatedAt) - r.CreatedAt).TotalHours);
            return new
            {
                sopId = g.Key,
                name = g.First().Sop.Name,
                used = g.Count(),
                completed = done.Count,
                delayed = g.Count(r => r.WasDelayed),
                completionRate = g.Count() == 0 ? 0 : Math.Round(100.0 * done.Count / g.Count(), 1),
                avgHours
            };
        }).OrderByDescending(x => x.used).Take(20);

        return Ok(new
        {
            periodDays = days,
            activeSops = await _db.Sops.CountAsync(s => s.OrganizationId == orgId),
            totalRuns = runs.Count,
            completedRuns = completed.Count,
            delayedRuns = runs.Count(r => r.WasDelayed),
            inProgress = runs.Count(r => r.Status == "InProgress"),
            top = bySop
        });
    }

    [HttpGet]
    [RequirePermission(Permissions.SopsRead)]
    public async Task<IActionResult> List(
        [FromQuery] string? q,
        [FromQuery] string? tag,
        [FromQuery] string? category,
        [FromQuery] string? procedureType,
        [FromQuery] Guid? serviceId,
        [FromQuery] Guid? clientId)
    {
        var orgId = User.GetOrganizationId();
        var query = _db.Sops.Include(s => s.Steps).Include(s => s.Scripts)
            .Where(s => s.OrganizationId == orgId);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(s =>
                s.Name.ToLower().Contains(term) ||
                s.UsageDescription.ToLower().Contains(term) ||
                (s.Outcome != null && s.Outcome.ToLower().Contains(term)) ||
                s.ProcedureType.ToLower().Contains(term) ||
                s.TriggerDescription.ToLower().Contains(term) ||
                s.SituationSearch.ToLower().Contains(term) ||
                s.ApplicableArea.ToLower().Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(tag))
            query = query.Where(s => s.Tags.Contains(tag));
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(s => s.Category == category);
        if (!string.IsNullOrWhiteSpace(procedureType))
            query = query.Where(s => s.ProcedureType == procedureType);
        if (serviceId.HasValue)
            query = query.Where(s => s.ServiceItemId == serviceId);

        var items = await query.OrderBy(s => s.Name).ToListAsync();

        // Overlay por cliente: prioriza SOPs que têm overlay daquele cliente
        if (clientId.HasValue)
        {
            var withOverlay = await _db.SopOverlays
                .Where(o => o.OrganizationId == orgId && o.ClientId == clientId)
                .Select(o => o.SopId)
                .Distinct()
                .ToListAsync();
            items = items
                .OrderByDescending(s => withOverlay.Contains(s.Id))
                .ThenBy(s => s.Name)
                .ToList();
        }

        var runCounts = await _db.SopRuns.Where(r => r.OrganizationId == orgId)
            .GroupBy(r => r.SopId)
            .Select(g => new { sopId = g.Key, count = g.Count() })
            .ToDictionaryAsync(x => x.sopId, x => x.count);

        return Ok(items.Select(s => MapSummary(s, runCounts.GetValueOrDefault(s.Id))));
    }

    [HttpGet("runs/mine")]
    [RequirePermission(Permissions.SopsRead)]
    public async Task<IActionResult> MyRuns([FromQuery] string? status = "InProgress")
    {
        var orgId = User.GetOrganizationId();
        var uid = User.GetUserId();
        var q = _db.SopRuns.Include(r => r.Sop).Include(r => r.Client)
            .Where(r => r.OrganizationId == orgId && r.StartedByUserId == uid);
        if (!string.IsNullOrWhiteSpace(status) && status != "all")
            q = q.Where(r => r.Status == status);
        var items = await q.OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt).Take(40).ToListAsync();
        return Ok(items.Select(r => new
        {
            id = r.Id,
            sopId = r.SopId,
            sopName = r.Sop.Name,
            status = r.Status,
            clientId = r.ClientId,
            clientName = r.Client?.Name,
            wasDelayed = r.WasDelayed,
            createdAt = r.CreatedAt,
            completedAtUtc = r.CompletedAtUtc
        }));
    }

    [HttpGet("{id:guid}")]
    [RequirePermission(Permissions.SopsRead)]
    public async Task<IActionResult> Get(Guid id, [FromQuery] Guid? clientId)
    {
        var sop = await _db.Sops
            .Include(s => s.Scripts)
            .Include(s => s.Steps)
            .Include(s => s.ServiceItem)
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == User.GetOrganizationId());
        if (sop is null) return NotFound();

        var overlays = await _db.SopOverlays
            .Include(o => o.Client)
            .Where(o => o.SopId == id && o.OrganizationId == User.GetOrganizationId())
            .Where(o => o.ClientId == null || (clientId.HasValue && o.ClientId == clientId))
            .OrderBy(o => o.SortOrder)
            .ToListAsync();

        return Ok(Map(sop, overlays));
    }

    [HttpPost]
    [RequirePermission(Permissions.SopsWrite)]
    public async Task<IActionResult> Create([FromBody] SopBody body)
    {
        var aliases = body.SituationAliases ?? [];
        var sop = new Domain.Entities.Sop
        {
            OrganizationId = User.GetOrganizationId(),
            Name = body.Name,
            UsageDescription = body.UsageDescription ?? "",
            Procedure = body.Procedure ?? "",
            Rules = body.Rules ?? "",
            Category = body.Category ?? "Geral",
            ProcedureType = body.ProcedureType ?? body.Category ?? "Geral",
            ApplicableArea = body.ApplicableArea ?? "Operações",
            TriggerDescription = body.TriggerDescription ?? "",
            DefaultResponsible = body.DefaultResponsible,
            SlaBusinessDays = body.SlaBusinessDays,
            SituationAliases = aliases,
            SituationSearch = BuildSituationSearch(aliases, body.TriggerDescription, body.Name),
            IsTemplate = body.IsTemplate ?? false,
            PackKey = body.PackKey,
            ServiceItemId = body.ServiceItemId,
            Tags = body.Tags ?? [],
            EstimatedMinutes = body.EstimatedMinutes,
            Outcome = body.Outcome,
            Version = 1,
            OwnerUserId = User.GetUserId(),
            LastReviewedAtUtc = DateTime.UtcNow
        };
        _db.Sops.Add(sop);
        await _db.SaveChangesAsync();
        await ReplaceStepsAsync(sop.Id, body.Steps);
        await _db.Entry(sop).Collection(s => s.Steps).LoadAsync();
        await _db.Entry(sop).Collection(s => s.Scripts).LoadAsync();
        return Ok(Map(sop, []));
    }

    [HttpPut("{id:guid}")]
    [RequirePermission(Permissions.SopsWrite)]
    public async Task<IActionResult> Update(Guid id, [FromBody] SopBody body)
    {
        var sop = await _db.Sops.Include(s => s.Scripts).Include(s => s.Steps)
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == User.GetOrganizationId());
        if (sop is null) return NotFound();
        sop.Name = body.Name;
        sop.UsageDescription = body.UsageDescription ?? sop.UsageDescription;
        sop.Procedure = body.Procedure ?? sop.Procedure;
        sop.Rules = body.Rules ?? sop.Rules;
        if (body.Category is not null) sop.Category = body.Category;
        if (body.ProcedureType is not null) sop.ProcedureType = body.ProcedureType;
        if (body.ApplicableArea is not null) sop.ApplicableArea = body.ApplicableArea;
        if (body.TriggerDescription is not null) sop.TriggerDescription = body.TriggerDescription;
        if (body.DefaultResponsible is not null) sop.DefaultResponsible = body.DefaultResponsible;
        if (body.SlaBusinessDays.HasValue) sop.SlaBusinessDays = body.SlaBusinessDays;
        if (body.SituationAliases is not null)
        {
            sop.SituationAliases = body.SituationAliases;
            sop.SituationSearch = BuildSituationSearch(body.SituationAliases, sop.TriggerDescription, sop.Name);
        }
        else
            sop.SituationSearch = BuildSituationSearch(sop.SituationAliases, sop.TriggerDescription, sop.Name);
        if (body.IsTemplate.HasValue) sop.IsTemplate = body.IsTemplate.Value;
        if (body.PackKey is not null) sop.PackKey = body.PackKey;
        if (body.ServiceItemId.HasValue) sop.ServiceItemId = body.ServiceItemId;
        if (body.Tags is not null) sop.Tags = body.Tags;
        if (body.EstimatedMinutes.HasValue) sop.EstimatedMinutes = body.EstimatedMinutes;
        if (body.Outcome is not null) sop.Outcome = body.Outcome;
        if (body.BumpVersion == true) sop.Version += 1;
        sop.LastReviewedAtUtc = DateTime.UtcNow;
        sop.UpdatedAt = DateTime.UtcNow;

        if (body.Steps is not null)
            await ReplaceStepsAsync(sop.Id, body.Steps, clearExisting: true, existing: sop);

        await _db.SaveChangesAsync();
        await _db.Entry(sop).Collection(s => s.Steps).LoadAsync();
        return Ok(Map(sop, []));
    }

    [HttpPost("{id:guid}/overlays")]
    [RequirePermission(Permissions.SopsWrite)]
    public async Task<IActionResult> AddOverlay(Guid id, [FromBody] OverlayBody body)
    {
        var sop = await _db.Sops.FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == User.GetOrganizationId());
        if (sop is null) return NotFound();
        if (body.ClientId is Guid cid)
        {
            var ok = await ClientScope.Query(_db, User).AnyAsync(c => c.Id == cid);
            if (!ok) return BadRequest(new { detail = "Cliente inválido." });
        }

        var overlay = new Domain.Entities.SopOverlay
        {
            OrganizationId = User.GetOrganizationId(),
            SopId = id,
            ClientId = body.ClientId,
            ServiceItemId = body.ServiceItemId,
            Kind = string.IsNullOrWhiteSpace(body.Kind) ? "Rule" : body.Kind!,
            Title = body.Title ?? body.Kind ?? "Regra",
            Body = body.Body ?? "",
            SortOrder = body.SortOrder ?? 0
        };
        _db.SopOverlays.Add(overlay);
        await _db.SaveChangesAsync();
        return Ok(new
        {
            id = overlay.Id,
            kind = overlay.Kind,
            title = overlay.Title,
            body = overlay.Body,
            clientId = overlay.ClientId,
            serviceItemId = overlay.ServiceItemId
        });
    }

    [HttpPost("{id:guid}/scripts")]
    [RequirePermission(Permissions.SopsWrite)]
    public async Task<IActionResult> AddScript(Guid id, [FromBody] ScriptBody body)
    {
        var sop = await _db.Sops.Include(s => s.Scripts).Include(s => s.Steps)
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == User.GetOrganizationId());
        if (sop is null) return NotFound();
        _db.SopScripts.Add(new Domain.Entities.SopScript
        {
            SopId = id,
            ScriptType = body.Type ?? body.ScriptType ?? "Default",
            Title = body.Title ?? body.Type ?? "Script",
            Content = body.Content
        });
        await _db.SaveChangesAsync();
        return Ok(Map(sop, []));
    }

    [HttpPost("{id:guid}/runs")]
    [RequirePermission(Permissions.SopsRead)]
    public async Task<IActionResult> StartRun(Guid id, [FromBody] StartRunBody? body)
    {
        var sop = await _db.Sops.Include(s => s.Steps)
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == User.GetOrganizationId());
        if (sop is null) return NotFound();
        if (sop.Steps.Count == 0)
            return BadRequest(new { detail = "SOP sem passos — adicione um checklist antes de executar." });

        if (body?.ClientId is Guid clientId)
        {
            var ok = await ClientScope.Query(_db, User).AnyAsync(c => c.Id == clientId);
            if (!ok) return BadRequest(new { detail = "Cliente inválido." });
        }

        var run = new Domain.Entities.SopRun
        {
            OrganizationId = User.GetOrganizationId(),
            SopId = sop.Id,
            StartedByUserId = User.GetUserId(),
            ClientId = body?.ClientId,
            ServiceItemId = body?.ServiceItemId ?? sop.ServiceItemId,
            AgendaEventId = body?.AgendaEventId,
            TodoItemId = body?.TodoItemId,
            Status = "InProgress",
            Notes = body?.Notes
        };
        foreach (var step in sop.Steps.OrderBy(s => s.SortOrder))
        {
            run.Steps.Add(new Domain.Entities.SopRunStep
            {
                SopStepId = step.Id,
                IsCompleted = false
            });
        }
        _db.SopRuns.Add(run);
        await _db.SaveChangesAsync();
        return Ok(await MapRunAsync(run.Id));
    }

    [HttpGet("runs/{runId:guid}")]
    [RequirePermission(Permissions.SopsRead)]
    public async Task<IActionResult> GetRun(Guid runId)
    {
        var mapped = await MapRunAsync(runId);
        return mapped is null ? NotFound() : Ok(mapped);
    }

    [HttpPatch("runs/{runId:guid}")]
    [RequirePermission(Permissions.SopsRead)]
    public async Task<IActionResult> PatchRun(Guid runId, [FromBody] PatchRunBody body)
    {
        var run = await _db.SopRuns.FirstOrDefaultAsync(r =>
            r.Id == runId && r.OrganizationId == User.GetOrganizationId());
        if (run is null) return NotFound();
        if (body.AgendaEventId.HasValue) run.AgendaEventId = body.AgendaEventId;
        if (body.TodoItemId.HasValue) run.TodoItemId = body.TodoItemId;
        if (body.WasDelayed.HasValue) run.WasDelayed = body.WasDelayed.Value;
        if (body.DelayNotes is not null) run.DelayNotes = body.DelayNotes;
        if (body.Notes is not null) run.Notes = body.Notes;
        if (body.Status == "Abandoned" && run.Status == "InProgress")
            run.Status = "Abandoned";
        run.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(await MapRunAsync(runId));
    }

    [HttpPatch("runs/{runId:guid}/steps/{stepId:guid}")]
    [RequirePermission(Permissions.SopsRead)]
    public async Task<IActionResult> ToggleRunStep(Guid runId, Guid stepId, [FromBody] ToggleStepBody body)
    {
        var runStep = await _db.SopRunSteps
            .Include(s => s.SopRun)
            .FirstOrDefaultAsync(s => s.Id == stepId && s.SopRunId == runId);
        if (runStep is null || runStep.SopRun.OrganizationId != User.GetOrganizationId())
            return NotFound();
        if (runStep.SopRun.Status != "InProgress")
            return BadRequest(new { detail = "Execução já finalizada." });

        runStep.IsCompleted = body.IsCompleted ?? !runStep.IsCompleted;
        runStep.CompletedAtUtc = runStep.IsCompleted ? DateTime.UtcNow : null;
        runStep.UpdatedAt = DateTime.UtcNow;
        runStep.SopRun.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(await MapRunAsync(runId));
    }

    [HttpPost("runs/{runId:guid}/complete")]
    [RequirePermission(Permissions.SopsRead)]
    public async Task<IActionResult> CompleteRun(Guid runId)
    {
        var run = await _db.SopRuns.Include(r => r.Sop).Include(r => r.Steps).ThenInclude(s => s.SopStep)
            .FirstOrDefaultAsync(r => r.Id == runId && r.OrganizationId == User.GetOrganizationId());
        if (run is null) return NotFound();

        var missingCritical = run.Steps.Any(s => s.SopStep.IsCritical && !s.IsCompleted);
        if (missingCritical)
            return BadRequest(new { detail = "Conclua todos os passos críticos antes de finalizar." });

        run.Status = "Completed";
        run.CompletedAtUtc = DateTime.UtcNow;
        run.UpdatedAt = DateTime.UtcNow;

        if (run.Sop.SlaBusinessDays is int sla && sla > 0)
        {
            var deadline = run.CreatedAt.AddDays(sla);
            if (DateTime.UtcNow > deadline)
                run.WasDelayed = true;
        }

        await _db.SaveChangesAsync();
        return Ok(await MapRunAsync(runId));
    }

    private async Task ReplaceStepsAsync(
        Guid sopId,
        List<StepBody>? steps,
        bool clearExisting = false,
        Domain.Entities.Sop? existing = null)
    {
        if (steps is null) return;
        if (clearExisting && existing is not null)
            _db.SopSteps.RemoveRange(existing.Steps);

        var order = 1;
        foreach (var step in steps)
        {
            _db.SopSteps.Add(new Domain.Entities.SopStep
            {
                SopId = sopId,
                SortOrder = step.SortOrder > 0 ? step.SortOrder : order++,
                Title = step.Title,
                Instruction = step.Instruction ?? "",
                IsCritical = step.IsCritical ?? false,
                EstimatedMinutes = step.EstimatedMinutes,
                ActionKind = string.IsNullOrWhiteSpace(step.ActionKind) ? "none" : step.ActionKind!,
                ActionPath = step.ActionPath,
                ActionLabel = step.ActionLabel
            });
        }
        await _db.SaveChangesAsync();
    }

    private async Task<object?> MapRunAsync(Guid runId)
    {
        var run = await _db.SopRuns
            .Include(r => r.Sop)
            .Include(r => r.Client)
            .Include(r => r.Steps).ThenInclude(s => s.SopStep)
            .FirstOrDefaultAsync(r => r.Id == runId && r.OrganizationId == User.GetOrganizationId());
        if (run is null) return null;
        var total = run.Steps.Count;
        var done = run.Steps.Count(s => s.IsCompleted);
        var current = run.Steps.OrderBy(s => s.SopStep.SortOrder).FirstOrDefault(s => !s.IsCompleted);

        var overlays = await _db.SopOverlays
            .Where(o => o.SopId == run.SopId &&
                        (o.ClientId == null || o.ClientId == run.ClientId))
            .OrderBy(o => o.SortOrder)
            .Select(o => new { o.Id, o.Kind, o.Title, o.Body, o.ClientId })
            .ToListAsync();

        return new
        {
            id = run.Id,
            sopId = run.SopId,
            sopName = run.Sop.Name,
            status = run.Status,
            clientId = run.ClientId,
            clientName = run.Client?.Name,
            serviceItemId = run.ServiceItemId,
            agendaEventId = run.AgendaEventId,
            todoItemId = run.TodoItemId,
            wasDelayed = run.WasDelayed,
            delayNotes = run.DelayNotes,
            progress = total == 0 ? 0 : (int)Math.Round(100.0 * done / total),
            currentStepIndex = current is null
                ? total
                : run.Steps.Count(s => s.SopStep.SortOrder < current.SopStep.SortOrder),
            completedAtUtc = run.CompletedAtUtc,
            notes = run.Notes,
            overlays,
            steps = run.Steps.OrderBy(s => s.SopStep.SortOrder).Select(s => new
            {
                id = s.Id,
                sopStepId = s.SopStepId,
                title = s.SopStep.Title,
                instruction = s.SopStep.Instruction,
                isCritical = s.SopStep.IsCritical,
                estimatedMinutes = s.SopStep.EstimatedMinutes,
                actionKind = s.SopStep.ActionKind,
                actionPath = s.SopStep.ActionPath,
                actionLabel = s.SopStep.ActionLabel,
                isCompleted = s.IsCompleted,
                completedAtUtc = s.CompletedAtUtc
            })
        };
    }

    private static string BuildSituationSearch(IEnumerable<string>? aliases, string? trigger, string? name) =>
        string.Join(" | ", new[] { name, trigger }.Concat(aliases ?? []).Where(s => !string.IsNullOrWhiteSpace(s)));

    private static object MapSummary(Domain.Entities.Sop s, int runCount) => new
    {
        id = s.Id,
        name = s.Name,
        usageDescription = s.UsageDescription,
        procedure = s.Procedure,
        rules = s.Rules,
        category = string.IsNullOrWhiteSpace(s.Category) ? "Geral" : s.Category,
        procedureType = s.ProcedureType,
        applicableArea = s.ApplicableArea,
        triggerDescription = s.TriggerDescription,
        defaultResponsible = s.DefaultResponsible,
        slaBusinessDays = s.SlaBusinessDays,
        situationAliases = s.SituationAliases,
        isTemplate = s.IsTemplate,
        packKey = s.PackKey,
        serviceItemId = s.ServiceItemId,
        tags = s.Tags,
        version = s.Version,
        estimatedMinutes = s.EstimatedMinutes,
        outcome = s.Outcome,
        stepCount = s.Steps.Count,
        scriptCount = s.Scripts.Count,
        runCount,
        lastReviewedAtUtc = s.LastReviewedAtUtc
    };

    private static object Map(Domain.Entities.Sop sop, IEnumerable<Domain.Entities.SopOverlay> overlays) => new
    {
        id = sop.Id,
        name = sop.Name,
        usageDescription = sop.UsageDescription,
        procedure = sop.Procedure,
        rules = sop.Rules,
        category = string.IsNullOrWhiteSpace(sop.Category) ? "Geral" : sop.Category,
        procedureType = sop.ProcedureType,
        applicableArea = sop.ApplicableArea,
        triggerDescription = sop.TriggerDescription,
        defaultResponsible = sop.DefaultResponsible,
        slaBusinessDays = sop.SlaBusinessDays,
        situationAliases = sop.SituationAliases,
        isTemplate = sop.IsTemplate,
        packKey = sop.PackKey,
        serviceItemId = sop.ServiceItemId,
        serviceName = sop.ServiceItem?.Title,
        tags = sop.Tags,
        version = sop.Version,
        estimatedMinutes = sop.EstimatedMinutes,
        outcome = sop.Outcome,
        lastReviewedAtUtc = sop.LastReviewedAtUtc,
        ownerUserId = sop.OwnerUserId,
        overlays = overlays.Select(o => new
        {
            id = o.Id,
            kind = o.Kind,
            title = o.Title,
            body = o.Body,
            clientId = o.ClientId,
            clientName = o.Client?.Name,
            serviceItemId = o.ServiceItemId
        }),
        steps = sop.Steps.OrderBy(s => s.SortOrder).Select(s => new
        {
            id = s.Id,
            sortOrder = s.SortOrder,
            title = s.Title,
            instruction = s.Instruction,
            isCritical = s.IsCritical,
            estimatedMinutes = s.EstimatedMinutes,
            actionKind = s.ActionKind,
            actionPath = s.ActionPath,
            actionLabel = s.ActionLabel
        }),
        scripts = sop.Scripts.Select(s => new { id = s.Id, type = s.ScriptType, content = s.Content, title = s.Title })
    };

    public record SopBody(
        string Name, string? UsageDescription, string? Procedure, string? Rules,
        string? Category, string? ProcedureType, string? ApplicableArea, string? TriggerDescription,
        string? DefaultResponsible, int? SlaBusinessDays, List<string>? SituationAliases,
        bool? IsTemplate, string? PackKey, Guid? ServiceItemId,
        List<string>? Tags, int? EstimatedMinutes, string? Outcome,
        bool? BumpVersion, List<StepBody>? Steps);
    public record StepBody(
        string Title, string? Instruction, bool? IsCritical, int? EstimatedMinutes, int SortOrder,
        string? ActionKind, string? ActionPath, string? ActionLabel);
    public record ScriptBody(string Content, string? Type, string? ScriptType, string? Title);
    public record StartRunBody(Guid? ClientId, Guid? ServiceItemId, Guid? AgendaEventId, Guid? TodoItemId, string? Notes);
    public record PatchRunBody(Guid? AgendaEventId, Guid? TodoItemId, bool? WasDelayed, string? DelayNotes, string? Notes, string? Status);
    public record ToggleStepBody(bool? IsCompleted);
    public record OverlayBody(string? Kind, string? Title, string? Body, Guid? ClientId, Guid? ServiceItemId, int? SortOrder);
}
