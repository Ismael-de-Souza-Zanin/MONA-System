namespace FattoVirtual.Domain.Enums;

public static class Permissions
{
    public const string Dashboard = "Dashboard";
    public const string ClientsRead = "Clients.Read";
    public const string ClientsWrite = "Clients.Write";
    public const string EmployeesRead = "Employees.Read";
    public const string EmployeesWrite = "Employees.Write";
    public const string PyramidView = "Pyramid.View";
    public const string FinanceOwn = "Finance.Own";
    public const string FinanceAll = "Finance.All";
    public const string PartnersRead = "Partners.Read";
    public const string PartnersWrite = "Partners.Write";
    public const string ServicesRead = "Services.Read";
    public const string ServicesWrite = "Services.Write";
    public const string ContractsRead = "Contracts.Read";
    public const string ContractsWrite = "Contracts.Write";
    public const string OnboardingRead = "Onboarding.Read";
    public const string OnboardingWrite = "Onboarding.Write";
    public const string AgendaRead = "Agenda.Read";
    public const string AgendaWrite = "Agenda.Write";
    public const string AgendaOthers = "Agenda.Others";
    public const string SopsRead = "Sops.Read";
    public const string SopsWrite = "Sops.Write";
    public const string AppsRead = "Apps.Read";
    public const string AppsWrite = "Apps.Write";
    public const string TodosRead = "Todos.Read";
    public const string TodosWrite = "Todos.Write";
    public const string TodosAll = "Todos.All";
    public const string Settings = "Settings";
    public const string ShareLinks = "ShareLinks";
    public const string Profiles = "Profiles";
    public const string Categories = "Categories";
    public const string EmailsRead = "Emails.Read";
    public const string EmailsWrite = "Emails.Write";
    public const string EmailsSend = "Emails.Send";
    public const string FaqsRead = "Faqs.Read";
    public const string FaqsWrite = "Faqs.Write";

    public static IReadOnlyList<string> All { get; } =
    [
        Dashboard, ClientsRead, ClientsWrite, EmployeesRead, EmployeesWrite, PyramidView,
        FinanceOwn, FinanceAll, PartnersRead, PartnersWrite, ServicesRead, ServicesWrite,
        ContractsRead, ContractsWrite, OnboardingRead, OnboardingWrite, AgendaRead, AgendaWrite,
        AgendaOthers, SopsRead, SopsWrite, AppsRead, AppsWrite, TodosRead, TodosWrite, TodosAll,
        Settings, ShareLinks, Profiles, Categories, EmailsRead, EmailsWrite, EmailsSend,
        FaqsRead, FaqsWrite
    ];

    public static IReadOnlyList<string> OwnerDefaults { get; } = All;
}
