using Microsoft.Extensions.DependencyInjection;
using WhatsAppKit.Abstractions;
using WhatsAppKit.Providers;

namespace WhatsAppKit;

public static class WhatsAppKitServiceCollectionExtensions
{
    public static IServiceCollection AddWhatsAppKit(this IServiceCollection services, Action<DevFileWhatsAppOptions>? configureDev = null)
    {
        if (configureDev is not null) services.Configure(configureDev);
        else services.Configure<DevFileWhatsAppOptions>(_ => { });
        services.Configure<MetaCloudWhatsAppOptions>(_ => { });
        services.AddSingleton<DevFileWhatsAppSender>();
        services.AddSingleton<MetaCloudWhatsAppSender>();
        services.AddSingleton<IWhatsAppProviderFactory, WhatsAppProviderFactory>();
        services.AddSingleton<IWhatsAppSender>(sp => sp.GetRequiredService<DevFileWhatsAppSender>());
        services.AddSingleton<IWhatsAppInbox>(sp => sp.GetRequiredService<DevFileWhatsAppSender>());
        return services;
    }
}
