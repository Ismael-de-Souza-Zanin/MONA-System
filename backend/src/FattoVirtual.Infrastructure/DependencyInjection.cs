using EmailKit;
using EmailKit.Providers;
using WhatsAppKit;
using FattoVirtual.Application.Abstractions.Integrations;
using FattoVirtual.Domain.Enums;
using FattoVirtual.Infrastructure.Identity;
using FattoVirtual.Infrastructure.Integrations;
using FattoVirtual.Infrastructure.Persistence;
using FattoVirtual.Infrastructure.Security;
using FattoVirtual.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FattoVirtual.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddIdentity<AppUser, IdentityRole>(options =>
            {
                options.Password.RequiredLength = 6;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<ISecretProtector, AesSecretProtector>();
        services.AddScoped<DbSeeder>();

        // Portas de integração (troque adapters sem alterar domínio/UI)
        services.AddSingleton<IExternalCalendarProvider, NullExternalCalendarProvider>();
        services.AddSingleton<INotificationDispatcher, LogNotificationDispatcher>();
        services.AddHostedService<AgendaReminderBackgroundService>();
        services.AddHostedService<TodoOverdueBackgroundService>();
        services.AddHostedService<ScheduledEmailBackgroundService>();

        // EmailKit portátil (POC: DevFile; produção: Gmail/Outlook via factory)
        var emailOutbox = configuration["EmailKit:OutboxDirectory"]
            ?? Path.Combine(Path.GetTempPath(), "fattovirtual-email-outbox");
        services.AddEmailKit(o => o.OutputDirectory = emailOutbox);
        services.Configure<SmtpEmailOptions>(configuration.GetSection("EmailKit:Smtp"));

        var waOutbox = configuration["WhatsAppKit:OutboxDirectory"]
            ?? Path.Combine(Path.GetTempPath(), "fattovirtual-whatsapp-outbox");
        services.AddWhatsAppKit(o => o.OutputDirectory = waOutbox);

        return services;
    }
}

public class DbSeeder
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public DbSeeder(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task SeedAsync()
    {
        await _db.Database.MigrateAsync();

        if (!await _db.Organizations.AnyAsync())
        {
            var org = new Domain.Entities.Organization
            {
                Name = "Fatto Virtual",
                Email = "contato@fattovirtual.com",
                SupportWhatsAppUrl = "https://wa.me/5500000000000",
                Kind = "Agency",
                DefaultTimeZoneId = "America/Sao_Paulo",
                DefaultLocale = "pt-BR",
                MaxClients = 500,
                MaxAssistants = 50
            };
            _db.Organizations.Add(org);

            var ownerType = new Domain.Entities.AccessType
            {
                OrganizationId = org.Id,
                Name = "Owner",
                Description = "Conta principal",
                IsOwnerType = true,
                Permissions = Permissions.OwnerDefaults.ToList()
            };
            var agentType = new Domain.Entities.AccessType
            {
                OrganizationId = org.Id,
                Name = "Agente",
                Description = "Usuário compartilhado padrão",
                Permissions =
                [
                    Permissions.Dashboard, Permissions.ClientsRead, Permissions.ClientsWrite,
                    Permissions.TodosRead, Permissions.TodosWrite,
                    Permissions.AgendaRead, Permissions.AgendaWrite, Permissions.SopsRead, Permissions.FinanceOwn,
                    Permissions.OnboardingRead, Permissions.ShareLinks
                ]
            };
            var qualityType = new Domain.Entities.AccessType
            {
                OrganizationId = org.Id,
                Name = "Qualidade",
                Description = "Time de qualidade",
                Permissions =
                [
                    Permissions.Dashboard, Permissions.SopsRead, Permissions.SopsWrite, Permissions.ClientsRead,
                    Permissions.TodosRead, Permissions.TodosWrite, Permissions.AgendaRead, Permissions.ShareLinks
                ]
            };
            var coAdminType = new Domain.Entities.AccessType
            {
                OrganizationId = org.Id,
                Name = "Co-admin",
                Description = "Mesma hierarquia da conta principal",
                IsOwnerType = true,
                Permissions = Permissions.OwnerDefaults.ToList()
            };
            _db.AccessTypes.AddRange(ownerType, coAdminType, agentType, qualityType);
            await _db.SaveChangesAsync();

            var ju = new AppUser
            {
                UserName = "ju@fattovirtual.com",
                Email = "ju@fattovirtual.com",
                FullName = "Ju",
                OrganizationId = org.Id,
                AccessTypeId = ownerType.Id,
                IsOrganizationOwner = true,
                EmailConfirmed = true
            };
            await _userManager.CreateAsync(ju, "Admin123!");

            _db.FaqItems.AddRange(
                new Domain.Entities.FaqItem
                {
                    OrganizationId = org.Id,
                    Question = "Como adiciono um cliente?",
                    Answer = "Em Clientes totais, use Adicionar clientes e preencha os campos.",
                    SortOrder = 1
                },
                new Domain.Entities.FaqItem
                {
                    OrganizationId = org.Id,
                    Question = "Quem pode editar SOPs?",
                    Answer = "Somente o time de qualidade e a Ju (conta principal).",
                    SortOrder = 2
                });

            await _db.SaveChangesAsync();
        }

        await EnsureCoAdminAccessTypeAsync();
        await EnsureEmailPermissionsAsync();
        await EnsureShareLinksPermissionAsync();
        await EnsureFaqsPermissionAsync();
        await EnsureSampleSopAsync();
        await EnsureUniversalSopsAsync();
        await EnsureAtendimentoSopsAsync();
        await EnsureOrgScaleFieldsAsync();
        await EnsureClientJsonListsAsync();
        await EnsureStarterClientGroupsAsync();
        await EnsureDefaultTodoBoardColumnsAsync();
    }

    /// <summary>Garante ShareLinks em Agente/Qualidade (orgs já seedadas).</summary>
    private async Task EnsureShareLinksPermissionAsync()
    {
        var types = await _db.AccessTypes
            .Where(t => t.Name == "Agente" || t.Name == "Qualidade")
            .ToListAsync();
        var dirty = false;
        foreach (var t in types)
        {
            if (t.Permissions.Contains(Permissions.ShareLinks)) continue;
            t.Permissions = [.. t.Permissions, Permissions.ShareLinks];
            t.UpdatedAt = DateTime.UtcNow;
            dirty = true;
        }
        if (dirty) await _db.SaveChangesAsync();
    }

    /// <summary>Garante Faqs.Read/Write no tipo owner e Faqs.Read em Agente/Qualidade.</summary>
    private async Task EnsureFaqsPermissionAsync()
    {
        var dirty = false;
        var owner = await _db.AccessTypes.Where(t => t.IsOwnerType).ToListAsync();
        foreach (var t in owner)
        {
            var next = t.Permissions.ToList();
            if (!next.Contains(Permissions.FaqsRead)) next.Add(Permissions.FaqsRead);
            if (!next.Contains(Permissions.FaqsWrite)) next.Add(Permissions.FaqsWrite);
            if (next.Count == t.Permissions.Count && next.All(p => t.Permissions.Contains(p))) continue;
            t.Permissions = next;
            t.UpdatedAt = DateTime.UtcNow;
            dirty = true;
        }

        var readers = await _db.AccessTypes
            .Where(t => t.Name == "Agente" || t.Name == "Qualidade")
            .ToListAsync();
        foreach (var t in readers)
        {
            if (t.Permissions.Contains(Permissions.FaqsRead)) continue;
            t.Permissions = [.. t.Permissions, Permissions.FaqsRead];
            t.UpdatedAt = DateTime.UtcNow;
            dirty = true;
        }
        if (dirty) await _db.SaveChangesAsync();
    }

    private async Task EnsureDefaultTodoBoardColumnsAsync()
    {
        var orgIds = await _db.Organizations.Select(o => o.Id).ToListAsync();
        foreach (var orgId in orgIds)
        {
            if (await _db.TodoBoardColumns.AnyAsync(c => c.OrganizationId == orgId)) continue;
            var todoCol = new Domain.Entities.TodoBoardColumn
            {
                OrganizationId = orgId, Name = "A fazer", Color = "#64748B", SortOrder = 0
            };
            var progressCol = new Domain.Entities.TodoBoardColumn
            {
                OrganizationId = orgId, Name = "Em progresso", Color = "#0369A1", SortOrder = 1
            };
            var doneCol = new Domain.Entities.TodoBoardColumn
            {
                OrganizationId = orgId, Name = "Concluída", Color = "#047857", SortOrder = 2, MarksComplete = true
            };
            _db.TodoBoardColumns.AddRange(todoCol, progressCol, doneCol);
            await _db.SaveChangesAsync();

            var todos = await _db.TodoItems.Where(t => t.OrganizationId == orgId).ToListAsync();
            foreach (var t in todos)
            {
                t.BoardColumnId = t.Status switch
                {
                    Domain.Enums.TodoStatus.Done => doneCol.Id,
                    Domain.Enums.TodoStatus.InProgress => progressCol.Id,
                    _ => todoCol.Id
                };
            }
            await _db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Migration antiga gravou Tags/ServiceScopes como "" (JSON inválido) — lista de clientes quebrava.
    /// </summary>
    private async Task EnsureClientJsonListsAsync()
    {
        await _db.Database.ExecuteSqlRawAsync(
            """
            UPDATE "Clients"
            SET "Tags" = '[]'
            WHERE "Tags" IS NULL OR btrim("Tags") = '' OR left(btrim("Tags"), 1) <> '[';
            """);
        await _db.Database.ExecuteSqlRawAsync(
            """
            UPDATE "Clients"
            SET "ServiceScopes" = '[]'
            WHERE "ServiceScopes" IS NULL OR btrim("ServiceScopes") = '' OR left(btrim("ServiceScopes"), 1) <> '[';
            """);
    }

    private async Task EnsureOrgScaleFieldsAsync()
    {
        var orgs = await _db.Organizations.ToListAsync();
        foreach (var org in orgs)
        {
            if (string.IsNullOrWhiteSpace(org.Kind)) org.Kind = "Agency";
            if (string.IsNullOrWhiteSpace(org.DefaultTimeZoneId)) org.DefaultTimeZoneId = "America/Sao_Paulo";
            if (org.MaxClients is null) org.MaxClients = 500;
            if (org.MaxAssistants is null) org.MaxAssistants = 50;
        }
        await _db.SaveChangesAsync();
    }

    /// <summary>Grupos iniciais genéricos (renomeáveis) — sem vertical de negócio do produto.</summary>
    private async Task EnsureStarterClientGroupsAsync()
    {
        var org = await _db.Organizations.FirstOrDefaultAsync();
        if (org is null) return;
        if (await _db.ClientGroups.AnyAsync(g => g.OrganizationId == org.Id)) return;

        var groups = new (string Name, string Color, string Desc)[]
        {
            ("Atendimento rápido", "#B45309", "Clientes que pedem resposta ágil"),
            ("Internacional", "#0369A1", "Fuso/idioma diferente do padrão da equipe"),
            ("Documentos / admin", "#006D69", "Rotina documental e administrativa"),
        };
        var order = 1;
        foreach (var g in groups)
        {
            _db.ClientGroups.Add(new Domain.Entities.ClientGroup
            {
                OrganizationId = org.Id,
                Name = g.Name,
                Color = g.Color,
                Description = g.Desc,
                SortOrder = order++
            });
        }
        await _db.SaveChangesAsync();
    }

    private async Task EnsureCoAdminAccessTypeAsync()
    {
        var orgIds = await _db.Organizations.Select(o => o.Id).ToListAsync();
        foreach (var orgId in orgIds)
        {
            var hasCoAdmin = await _db.AccessTypes.AnyAsync(a =>
                a.OrganizationId == orgId && a.Name == "Co-admin");
            if (hasCoAdmin) continue;

            _db.AccessTypes.Add(new Domain.Entities.AccessType
            {
                OrganizationId = orgId,
                Name = "Co-admin",
                Description = "Mesma hierarquia da conta principal",
                IsOwnerType = true,
                Permissions = Permissions.OwnerDefaults.ToList()
            });
        }

        await _db.SaveChangesAsync();
    }

    private async Task EnsureEmailPermissionsAsync()
    {
        var emailPerms = new[] { Permissions.EmailsRead, Permissions.EmailsWrite, Permissions.EmailsSend };
        var types = await _db.AccessTypes.Where(a => a.IsOwnerType).ToListAsync();
        foreach (var t in types)
        {
            var changed = false;
            foreach (var p in emailPerms)
            {
                if (t.Permissions.Contains(p)) continue;
                t.Permissions.Add(p);
                changed = true;
            }
            if (changed) t.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
    }

    private async Task EnsureSampleSopAsync()
    {
        if (await _db.Sops.AnyAsync(s => s.Steps.Any())) return;
        var orgId = await _db.Organizations.Select(o => o.Id).FirstOrDefaultAsync();
        if (orgId == Guid.Empty) return;

        var sop = new Domain.Entities.Sop
        {
            OrganizationId = orgId,
            Name = "Onboarding de cliente direto",
            Category = "Clientes",
            ProcedureType = "Onboarding",
            ApplicableArea = "Operações",
            TriggerDescription = "Preciso iniciar um cliente",
            SituationAliases = ["novo cliente", "cliente acabou de assinar", "iniciar onboarding"],
            SituationSearch = "Onboarding de cliente direto | Preciso iniciar um cliente | novo cliente | cliente acabou de assinar | iniciar onboarding",
            PackKey = "universal",
            IsTemplate = true,
            UsageDescription = "Use quando um cliente direto acaba de assinar e precisa entrar em operação sem ruído.",
            Procedure = "Siga os passos na ordem. Passos críticos bloqueiam a conclusão da execução.",
            Rules = "Não pule confirmação de fuso horário. Não envie e-mail a clientes-de-clientes por esta conta.",
            Outcome = "Cliente com acesso, agenda alinhada e primeiro follow-up programado.",
            EstimatedMinutes = 45,
            SlaBusinessDays = 2,
            Version = 1,
            Tags = ["onboarding", "cliente-direto"],
            LastReviewedAtUtc = DateTime.UtcNow
        };
        _db.Sops.Add(sop);
        await _db.SaveChangesAsync();
        _db.SopSteps.AddRange(
            new Domain.Entities.SopStep { SopId = sop.Id, SortOrder = 1, Title = "Confirmar dados e fuso do cliente", Instruction = "Valide e-mail, telefone e TimeZoneId IANA no perfil.", IsCritical = true, EstimatedMinutes = 5, ActionKind = "open_path", ActionPath = "/clientes", ActionLabel = "Abrir clientes" },
            new Domain.Entities.SopStep { SopId = sop.Id, SortOrder = 2, Title = "Criar kickoff na agenda", Instruction = "Agende no fuso do cliente; confira no seu fuso efetivo (casa ou viagem).", IsCritical = true, EstimatedMinutes = 10, ActionKind = "open_path", ActionPath = "/agenda", ActionLabel = "Abrir agenda" },
            new Domain.Entities.SopStep { SopId = sop.Id, SortOrder = 3, Title = "Gerar tarefas de follow-up", Instruction = "A partir do evento, crie tarefas com prazo — não misture status de reunião com checklist.", IsCritical = false, EstimatedMinutes = 10, ActionKind = "open_path", ActionPath = "/todos", ActionLabel = "Abrir tarefas" },
            new Domain.Entities.SopStep { SopId = sop.Id, SortOrder = 4, Title = "Programar e-mail de boas-vindas", Instruction = "Use o módulo E-mails (cliente direto). Envio programado no fuso efetivo da assistente.", IsCritical = true, EstimatedMinutes = 10, ActionKind = "open_path", ActionPath = "/emails", ActionLabel = "Abrir e-mails" },
            new Domain.Entities.SopStep { SopId = sop.Id, SortOrder = 5, Title = "Registrar no CRM", Instruction = "Anote decisões e próximos passos no CRM do cliente.", IsCritical = false, EstimatedMinutes = 10 }
        );
        await _db.SaveChangesAsync();
    }

    /// <summary>Núcleo operacional universal — situações comuns, sem packs de ramo no core.</summary>
    private async Task EnsureUniversalSopsAsync()
    {
        var orgId = await _db.Organizations.Select(o => o.Id).FirstOrDefaultAsync();
        if (orgId == Guid.Empty) return;

        var defs = new (string Name, string Category, string Type, string Trigger, string[] Aliases, string Outcome, int Minutes, int Sla, (string Title, string Instr, bool Crit, string? Path, string? Label)[] Steps)[]
        {
            ("Cobrança — pagamento vencido", "Financeiro", "Cobrança", "Pagamento está atrasado",
                ["cliente não pagou", "inadimplência", "cobrança"], "Pagamento recebido ou escalonado", 30, 2,
                [
                    ("Confirmar no financeiro", "Verifique se o pagamento realmente não entrou.", true, "/financeiro", "Abrir financeiro"),
                    ("Primeiro contato", "Use o canal preferido (overlay do cliente). Copie o script e registre.", true, null, null),
                    ("Agendar follow-up", "Crie lembrete/tarefa para o retorno.", false, "/agenda", "Abrir agenda"),
                    ("Escalonar se necessário", "Se sem retorno no prazo, avise a coordenação.", false, null, null)
                ]),
            ("Documento pendente", "Documentos", "Documento", "Documento está faltando",
                ["falta documento", "cliente não enviou doc"], "Documento recebido e arquivado", 20, 3,
                [
                    ("Identificar o documento", "Confirme qual documento falta e o prazo.", true, null, null),
                    ("Solicitar ao cliente", "Envie pedido claro com prazo.", true, null, null),
                    ("Registrar recebimento", "Arquive no cliente e marque a tarefa.", true, "/clientes", "Abrir clientes")
                ]),
            ("Solicitação de cancelamento", "Contratos", "Cancelamento", "Cliente quer cancelar",
                ["cancelar contrato", "encerrar serviço"], "Cancelamento tratado com regras e registro", 40, 1,
                [
                    ("Ouvir o motivo", "Registre o motivo sem prometer o que não pode.", true, null, null),
                    ("Verificar contrato/cláusulas", "Confira aviso prévio e multas (peça acesso se precisar).", true, "/contratos", "Abrir contratos"),
                    ("Propor retenção ou formalizar", "Siga regras da empresa (overlay).", true, null, null),
                    ("Registrar decisão", "Atualize CRM e tarefas de offboarding se houver.", true, "/clientes", "Abrir clientes")
                ]),
            ("Cliente não respondeu", "Atendimento", "Follow-up", "Cliente não respondeu",
                ["sem retorno", "ghosting", "follow-up"], "Retorno obtido ou escalonado", 15, 2,
                [
                    ("Checar último contato", "Veja canal e data do último toque.", true, "/clientes", "Abrir clientes"),
                    ("Segundo toque", "Use canal diferente se o overlay pedir.", true, null, null),
                    ("Criar lembrete", "Agende próximo contato.", false, "/agenda", "Abrir agenda")
                ]),
            ("Reunião e follow-up", "Atendimento", "Reunião", "Preciso de reunião / follow-up",
                ["agendar reunião", "follow-up reunião"], "Reunião feita e próximos passos em tarefas", 25, 1,
                [
                    ("Agendar no fuso certo", "Use agenda no fuso do cliente.", true, "/agenda", "Abrir agenda"),
                    ("Preparar pauta", "Liste objetivos e docs necessários.", false, null, null),
                    ("Após a reunião: tarefas", "Crie tarefas com prazo — não deixe só no chat.", true, "/todos", "Abrir tarefas")
                ]),
            ("Tarefa atrasada", "Pessoas", "Atraso", "Tarefa está atrasada",
                ["todo atrasado", "prazo estourou"], "Tarefa concluída ou replanejada com aviso", 15, 1,
                [
                    ("Abrir a tarefa", "Confirme dono, cliente e impacto.", true, "/todos", "Abrir tarefas"),
                    ("Replanejar ou concluir", "Atualize prazo ou finalize.", true, null, null),
                    ("Avisar stakeholders", "Chat interno ou alerta se crítico.", false, "/chat", "Abrir chat")
                ]),
            ("Comunicação interna", "Pessoas", "Comunicação", "Preciso alinhar com a equipe",
                ["pedir ajuda", "chat interno", "alinha com colega"], "Alinhamento registrado", 10, 1,
                [
                    ("Abrir chat", "Direto, grupo ou consigo — anexe cliente/tarefa se ajudar.", true, "/chat", "Abrir chat"),
                    ("Registrar decisão", "Se afetar cliente, anote no CRM.", false, "/clientes", "Abrir clientes")
                ]),
        };

        foreach (var d in defs)
        {
            if (await _db.Sops.AnyAsync(s => s.OrganizationId == orgId && s.Name == d.Name)) continue;
            var aliases = d.Aliases.ToList();
            var sop = new Domain.Entities.Sop
            {
                OrganizationId = orgId,
                Name = d.Name,
                Category = d.Category,
                ProcedureType = d.Type,
                ApplicableArea = d.Category,
                TriggerDescription = d.Trigger,
                SituationAliases = aliases,
                SituationSearch = string.Join(" | ", new[] { d.Name, d.Trigger }.Concat(aliases)),
                PackKey = "universal",
                IsTemplate = true,
                UsageDescription = d.Trigger,
                Procedure = "Modo rápido: avance um passo por vez. Use overlays do cliente/empresa sem duplicar esta SOP.",
                Rules = "Respeite ACL. Se a etapa pedir recurso sem acesso, solicite aprovação.",
                Outcome = d.Outcome,
                EstimatedMinutes = d.Minutes,
                SlaBusinessDays = d.Sla,
                DefaultResponsible = "Equipe operacional",
                Version = 1,
                Tags = [d.Type.ToLowerInvariant(), "universal"],
                LastReviewedAtUtc = DateTime.UtcNow
            };
            _db.Sops.Add(sop);
            await _db.SaveChangesAsync();
            var order = 1;
            foreach (var st in d.Steps)
            {
                _db.SopSteps.Add(new Domain.Entities.SopStep
                {
                    SopId = sop.Id,
                    SortOrder = order++,
                    Title = st.Title,
                    Instruction = st.Instr,
                    IsCritical = st.Crit,
                    ActionKind = st.Path is null ? "none" : "open_path",
                    ActionPath = st.Path,
                    ActionLabel = st.Label
                });
            }
            await _db.SaveChangesAsync();
        }
    }

    private async Task EnsureAtendimentoSopsAsync()
    {
        var orgId = await _db.Organizations.Select(o => o.Id).FirstOrDefaultAsync();
        if (orgId == Guid.Empty) return;

        var defs = new (string Name, string Trigger, string[] Aliases, (string Title, string Instr, string? Path, string? Label)[] Steps)[]
        {
            ("Pedido de orçamento", "Cliente pediu orçamento",
                ["quero orçamento", "preço", "quanto custa"],
                [
                    ("Captar serviço e janela", "Anote o que precisa, quando e onde.", "/clientes", "Abrir cliente"),
                    ("Checar agenda e capacidade", "Veja disponibilidade antes de prometer.", "/agenda", "Abrir agenda"),
                    ("Registrar follow-up", "Crie tarefa se não fechar na hora.", "/todos", "Abrir tarefas")
                ]),
            ("Remarcação de compromisso", "Preciso remarcar",
                ["remarcar", "trocar horário", "adiar"],
                [
                    ("Localizar o compromisso", "Abra a agenda do cliente.", "/agenda", "Abrir agenda"),
                    ("Aplicar a regra do cliente", "Overlay: prazo, taxa, quem avisar.", null, null),
                    ("Confirmar nova janela", "Atualize o evento e avise as partes.", "/agenda", "Abrir agenda")
                ]),
            ("Cliente já pagou", "Já paguei / enviei comprovante",
                ["já paguei", "comprovante", "paguei"],
                [
                    ("Anexar comprovante", "Peça o arquivo no portal se ainda não veio.", "/compartilhar", "Portal"),
                    ("Dar baixa no livro certo", "Agency se for a Fatto; ClientAr se for o negócio dele.", "/financeiro", "Abrir financeiro"),
                    ("Avisar o responsável", "Chat interno se a baixa depender de outra pessoa.", "/chat", "Abrir chat")
                ]),
            ("Ninguém compareceu", "Ninguém veio / não atenderam",
                ["ninguém veio", "no-show", "não apareceu"],
                [
                    ("Abrir incidente", "Registre no CRM com prioridade.", "/clientes", "Abrir cliente"),
                    ("Escalar", "Siga a árvore do ponto de atendimento.", null, null),
                    ("Registrar resolução", "Feche com decisão visível se o cliente precisa ver.", "/relatorios", "Relatórios")
                ]),
        };

        foreach (var d in defs)
        {
            if (await _db.Sops.AnyAsync(s => s.OrganizationId == orgId && s.Name == d.Name)) continue;
            var aliases = d.Aliases.ToList();
            var sop = new Domain.Entities.Sop
            {
                OrganizationId = orgId,
                Name = d.Name,
                Category = "Atendimento",
                ProcedureType = "Atendimento",
                ApplicableArea = "Atendimento",
                TriggerDescription = d.Trigger,
                SituationAliases = aliases,
                SituationSearch = string.Join(" | ", new[] { d.Name, d.Trigger }.Concat(aliases)),
                PackKey = "atendimento",
                IsTemplate = true,
                UsageDescription = d.Trigger,
                Procedure = "Ponto de atendimento do cliente define canal, SLA e escalonamento.",
                Rules = "Não misture o contexto de outro cliente. Use overlay da conta.",
                Outcome = "Atendimento registrado com próximo passo",
                EstimatedMinutes = 15,
                SlaBusinessDays = 1,
                Tags = ["atendimento", "pack"],
                LastReviewedAtUtc = DateTime.UtcNow
            };
            _db.Sops.Add(sop);
            await _db.SaveChangesAsync();
            var order = 1;
            foreach (var st in d.Steps)
            {
                _db.SopSteps.Add(new Domain.Entities.SopStep
                {
                    SopId = sop.Id,
                    SortOrder = order++,
                    Title = st.Title,
                    Instruction = st.Instr,
                    IsCritical = true,
                    ActionKind = st.Path is null ? "none" : "open_path",
                    ActionPath = st.Path,
                    ActionLabel = st.Label
                });
            }
            await _db.SaveChangesAsync();
        }
    }
}
