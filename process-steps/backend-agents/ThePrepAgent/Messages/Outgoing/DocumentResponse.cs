using System.Text.Json.Serialization;
using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;

namespace Bots;

public class DocumentResponse : IMessage
{
    [JsonPropertyName("messageType")]
    public string MessageType { get; } = typeof(DocumentResponse).Name;

    [JsonPropertyName("auditResult")]
    public AuditResult<PowerOfAttorney> AuditResult { get; set; } = new();

    [JsonPropertyName("requestId")]
    public string? RequestId { get; set; }
}