using EmailKit.Abstractions;
using EmailKit.Models;
using EmailKit.Providers;
using Microsoft.Extensions.DependencyInjection;

namespace EmailKit;

public sealed class EmailProviderFactory : IEmailProviderFactory
{
    private readonly IServiceProvider _sp;

    public EmailProviderFactory(IServiceProvider sp) => _sp = sp;

    public IEmailSender GetSender(EmailProviderKind kind) => kind switch
    {
        EmailProviderKind.Smtp => _sp.GetRequiredService<SmtpEmailSender>(),
        EmailProviderKind.Gmail => _sp.GetRequiredService<GmailApiEmailSender>(),
        EmailProviderKind.Outlook => _sp.GetRequiredService<OutlookGraphEmailSender>(),
        _ => _sp.GetRequiredService<DevFileEmailSender>()
    };

    public IMailboxClient GetMailbox(EmailProviderKind kind) => kind switch
    {
        EmailProviderKind.Gmail => _sp.GetRequiredService<GmailApiEmailSender>(),
        EmailProviderKind.Outlook => _sp.GetRequiredService<OutlookGraphEmailSender>(),
        _ => _sp.GetRequiredService<DemoMailboxClient>()
    };
}
