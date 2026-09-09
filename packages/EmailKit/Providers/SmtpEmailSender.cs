using System.Net;
using System.Net.Mail;
using EmailKit.Abstractions;
using EmailKit.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EmailKit.Providers;

public sealed class SmtpEmailOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 25;
    public bool EnableSsl { get; set; }
    public string? UserName { get; set; }
    public string? Password { get; set; }
    public string? DefaultFrom { get; set; }
}

/// <summary>Envio SMTP genérico — portátil para qualquer host SMTP.</summary>
public sealed class SmtpEmailSender : IEmailSender
{
    private readonly SmtpEmailOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<SmtpEmailOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public string ProviderKey => "smtp";

    public async Task<SendResult> SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = new SmtpClient(_options.Host, _options.Port)
            {
                EnableSsl = _options.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };
            if (!string.IsNullOrWhiteSpace(_options.UserName))
                client.Credentials = new NetworkCredential(_options.UserName, _options.Password);

            var from = string.IsNullOrWhiteSpace(message.From.Address) && _options.DefaultFrom is not null
                ? new MailAddress(_options.DefaultFrom)
                : new MailAddress(message.From.Address, message.From.DisplayName);

            using var mail = new MailMessage
            {
                From = from,
                Subject = message.Subject,
                Body = message.HtmlBody ?? message.TextBody ?? "",
                IsBodyHtml = !string.IsNullOrWhiteSpace(message.HtmlBody)
            };
            foreach (var to in message.To)
                mail.To.Add(new MailAddress(to.Address, to.DisplayName));
            foreach (var cc in message.Cc)
                mail.CC.Add(new MailAddress(cc.Address, cc.DisplayName));

            await client.SendMailAsync(mail, cancellationToken);
            _logger.LogInformation("EmailKit SMTP sent subject={Subject}", message.Subject);
            return SendResult.Ok(ProviderKey, Guid.NewGuid().ToString("N"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "EmailKit SMTP failed");
            return SendResult.Fail(ProviderKey, ex.Message);
        }
    }
}
