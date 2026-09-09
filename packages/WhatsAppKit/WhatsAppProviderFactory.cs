using Microsoft.Extensions.DependencyInjection;
using WhatsAppKit.Abstractions;
using WhatsAppKit.Models;
using WhatsAppKit.Providers;

namespace WhatsAppKit;

public sealed class WhatsAppProviderFactory : IWhatsAppProviderFactory
{
    private readonly IServiceProvider _sp;
    public WhatsAppProviderFactory(IServiceProvider sp) => _sp = sp;

    public IWhatsAppSender GetSender(WhatsAppProviderKind kind) => kind switch
    {
        WhatsAppProviderKind.MetaCloud => _sp.GetRequiredService<MetaCloudWhatsAppSender>(),
        _ => _sp.GetRequiredService<DevFileWhatsAppSender>()
    };

    public IWhatsAppInbox GetInbox(WhatsAppProviderKind kind) => kind switch
    {
        WhatsAppProviderKind.MetaCloud => _sp.GetRequiredService<MetaCloudWhatsAppSender>(),
        _ => _sp.GetRequiredService<DevFileWhatsAppSender>()
    };
}
