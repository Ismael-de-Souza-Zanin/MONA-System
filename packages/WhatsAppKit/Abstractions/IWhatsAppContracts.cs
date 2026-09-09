using WhatsAppKit.Models;

namespace WhatsAppKit.Abstractions;

public interface IWhatsAppSender
{
    string ProviderKey { get; }
    Task<WhatsAppSendResult> SendTextAsync(WhatsAppTextMessage message, CancellationToken cancellationToken = default);
}

public interface IWhatsAppInbox
{
    string ProviderKey { get; }
    Task<IReadOnlyList<WhatsAppInboundMessage>> ListRecentAsync(
        WhatsAppInboxQuery query,
        CancellationToken cancellationToken = default);
}

public interface IWhatsAppProviderFactory
{
    IWhatsAppSender GetSender(WhatsAppProviderKind kind);
    IWhatsAppInbox GetInbox(WhatsAppProviderKind kind);
}
