using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace FattoVirtual.Infrastructure.Security;

public interface ISecretProtector
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
}

public class AesSecretProtector : ISecretProtector
{
    private readonly byte[] _key;

    public AesSecretProtector(IConfiguration configuration)
    {
        var raw = configuration["Security:CredentialEncryptionKey"]
                  ?? "FattoVirtualDevKey_ChangeMe_32b!";
        _key = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
    }

    public string Encrypt(string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.GenerateIV();
        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
        var result = new byte[aes.IV.Length + cipherBytes.Length];
        Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
        Buffer.BlockCopy(cipherBytes, 0, result, aes.IV.Length, cipherBytes.Length);
        return Convert.ToBase64String(result);
    }

    public string Decrypt(string cipherText)
    {
        var full = Convert.FromBase64String(cipherText);
        using var aes = Aes.Create();
        aes.Key = _key;
        var iv = new byte[16];
        Buffer.BlockCopy(full, 0, iv, 0, 16);
        aes.IV = iv;
        using var decryptor = aes.CreateDecryptor();
        var cipherBytes = new byte[full.Length - 16];
        Buffer.BlockCopy(full, 16, cipherBytes, 0, cipherBytes.Length);
        var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
        return Encoding.UTF8.GetString(plainBytes);
    }
}
