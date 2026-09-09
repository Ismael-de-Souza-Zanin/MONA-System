using EmailKit.Abstractions;
using EmailKit.Providers;
using Microsoft.Extensions.DependencyInjection;

namespace EmailKit;

public static class EmailKitServiceCollectionExtensions
{
    /// <summary>
    /// Registra EmailKit de forma portátil. Hosts (FattoVirtual e outros) só precisam chamar isto.
    /// </summary>
    public static IServiceCollection AddEmailKit(this IServiceCollection services, Action<DevFileEmailOptions>? configureDev = null)
    {
        if (configureDev is not null)
            services.Configure(configureDev);
        else
            services.Configure<DevFileEmailOptions>(_ => { });

        services.Configure<SmtpEmailOptions>(_ => { });
        services.AddSingleton<DevFileEmailSender>();
        services.AddSingleton<SmtpEmailSender>();
        services.AddSingleton<GmailApiEmailSender>();
        services.AddSingleton<OutlookGraphEmailSender>();
        services.AddSingleton<DemoMailboxClient>();
        services.AddSingleton<IEmailProviderFactory, EmailProviderFactory>();
        services.AddSingleton<IEmailSender>(sp => sp.GetRequiredService<DevFileEmailSender>());
        services.AddSingleton<IMailboxClient>(sp => sp.GetRequiredService<DemoMailboxClient>());
        return services;
    }
}
