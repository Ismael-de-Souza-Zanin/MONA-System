namespace FattoVirtual.Application.Dtos;

public record OrganizationDto(Guid Id, string Name, string? Document, string? Phone, string? Email, string? Address, string? SupportWhatsAppUrl);
public record UpdateOrganizationRequest(string Name, string? Document, string? Phone, string? Email, string? Address, string? SupportWhatsAppUrl);

public record AccessTypeDto(Guid Id, string Name, string Description, List<string> Permissions, bool IsOwnerType);
public record UpsertAccessTypeRequest(string Name, string Description, List<string> Permissions);

public record ClientListItemDto(Guid Id, string Name, string? Phone, string? CompanyName, string Status);
public record ClientDetailDto(
    Guid Id, string Name, string? Phone, string? CompanyName, string? Email, string Status,
    string? CrmNotes, bool OnboardingCompleted,
    List<ClientTopicDto> Topics,
    List<ClientCredentialDto> Credentials,
    List<ClientAppDto> Apps,
    List<InvoiceDto> Invoices);
public record UpsertClientRequest(string Name, string? Phone, string? CompanyName, string? Email, string? CrmNotes);
public record ClientTopicDto(Guid Id, string Title, string Observation);
public record UpsertTopicRequest(string Title, string Observation);
public record ClientCredentialDto(Guid Id, string AppName, string Login, string Password);
public record UpsertCredentialRequest(string AppName, string Login, string Password);
public record ClientAppDto(Guid Id, string Name, Guid? AppId);
public record ChangeClientStatusRequest(
    string NewStatus,
    bool EmailSentConfirmed,
    bool PendingPaymentSettled,
    bool FinalMessageSent,
    bool PendenciesResolved,
    bool RemovedFromGroup);
public record ClientDashboardDto(int Total, int Active, int Inactive, int Hold, int Notice);

public record EmployeeDto(Guid Id, string Name, string? Phone, string? Email, string? Color, Guid? ManagerId, string Status, string? UserId);
public record EmployeeSummaryDto(
    Guid Id, string Name, string? Phone, string? Email, string? Color, string Status, Guid? ManagerId,
    List<ClientListItemDto> Clients,
    List<PaymentDto> Payments,
    List<EmployeeScheduleDayDto> Schedule,
    List<ContractDto> Contracts);
public record UpsertEmployeeRequest(string Name, string? Phone, string? Email, string? Color, Guid? ManagerId, string? UserId, string Status = "Active");
public record EmployeeScheduleDayDto(Guid Id, DateOnly Date, bool IsWorkDay, string? Note);
public record UpsertScheduleDayRequest(DateOnly Date, bool IsWorkDay, string? Note);
public record PyramidNodeDto(Guid Id, string Name, string? Color, string Status, List<PyramidNodeDto> Children);

public record PaymentDto(Guid Id, string Description, decimal Amount, DateTime? PaidAt, bool IsSettled, Guid? ClientId, string? ClientName, Guid? EmployeeId, string? TargetUserId);
public record UpsertPaymentRequest(string Description, decimal Amount, Guid? ClientId, Guid? EmployeeId, string? TargetUserId, bool IsSettled, DateTime? PaidAt);
public record InvoiceDto(Guid Id, string Reference, decimal Amount, DateOnly PeriodStart, DateOnly PeriodEnd, string Status);
public record UpsertInvoiceRequest(string Reference, decimal Amount, DateOnly PeriodStart, DateOnly PeriodEnd, string Status);
public record ActiveClientPaymentTaskDto(Guid ClientId, string ClientName, bool HasOpenPayment);

public record PartnerDto(Guid Id, string Name, string? ResponsibleName, string? Contact, string? Service, string? Observations);
public record UpsertPartnerRequest(string Name, string? ResponsibleName, string? Contact, string? Service, string? Observations);

public record ServiceItemDto(Guid Id, string Title, string Description);
public record UpsertServiceRequest(string Title, string Description);

public record ContractDto(Guid Id, string Name, string Status, string PartyType, Guid? ClientId, string? PartyName, Guid? EmployeeId, string? PdfPath);
public record UpsertContractRequest(string Name, string Status, string PartyType, Guid? ClientId, Guid? EmployeeId);

public record OnboardingItemDto(Guid Id, string Title, bool IsCompleted, int SortOrder);
public record UpsertOnboardingItemRequest(string Title, int SortOrder);
public record ChecklistTemplateDto(Guid Id, string Name, List<string> Items);
public record UpsertChecklistTemplateRequest(string Name, List<string> Items);
public record OnboardingClientDto(Guid ClientId, string ClientName, List<OnboardingItemDto> Items, bool Completed);

public record AgendaCategoryDto(Guid Id, string Name, string Color);
public record UpsertAgendaCategoryRequest(string Name, string Color);
public record AgendaEventDto(
    Guid Id, string Title, string? Description, DateTime StartsAt, DateTime EndsAt,
    Guid? CategoryId, string? CategoryName, string? CategoryColor,
    Guid? ResponsibleEmployeeId, string? ResponsibleName, string? ResponsibleColor,
    Guid? ClientId, string? ClientName, string? OwnerUserId);
public record UpsertAgendaEventRequest(
    string Title, string? Description, DateTime StartsAt, DateTime EndsAt,
    Guid? CategoryId, Guid? ResponsibleEmployeeId, Guid? ClientId);

public record AppCatalogDto(Guid Id, string Name, string? HomeUrl, string? DownloadUrl);
public record UpsertAppCatalogRequest(string Name, string? HomeUrl, string? DownloadUrl);

public record SopListItemDto(Guid Id, string Name, string UsageDescription, List<string> Tags);
public record SopDetailDto(Guid Id, string Name, string UsageDescription, string Procedure, string Rules, List<string> Tags, List<SopScriptDto> Scripts);
public record UpsertSopRequest(string Name, string UsageDescription, string Procedure, string Rules, List<string> Tags);
public record SopScriptDto(Guid Id, string ScriptType, string Title, string Content);
public record UpsertSopScriptRequest(string ScriptType, string Title, string Content);

public record TodoDto(Guid Id, string Title, string? Description, string Status, string Scope, string? AssignedUserId, Guid? ClientId, string? ClientName, string CreatedByUserId, List<TodoCommentDto> Comments);
public record UpsertTodoRequest(string Title, string? Description, string Scope, string? AssignedUserId, Guid? ClientId, string? Status);
public record TodoCommentDto(Guid Id, string AuthorUserId, string Content, bool NotifyOwner, DateTime CreatedAt);
public record AddTodoCommentRequest(string Content, bool NotifyOwner);

public record ShareLinkDto(Guid Id, string Token, string Tab, Guid? ClientId, DateTime? ExpiresAt, bool IsActive, string Url);
public record CreateShareLinkRequest(string Tab, Guid? ClientId, DateTime? ExpiresAt);

public record FaqDto(Guid Id, string Question, string Answer, int SortOrder);
public record UpsertFaqRequest(string Question, string Answer, int SortOrder);

public record DashboardDto(
    bool IsOwner,
    ClientDashboardDto? Clients,
    int Employees,
    int OpenTodos,
    int UpcomingEvents,
    int PendingOnboarding,
    int ActivePartners,
    int Services,
    int Contracts,
    int Sops);
