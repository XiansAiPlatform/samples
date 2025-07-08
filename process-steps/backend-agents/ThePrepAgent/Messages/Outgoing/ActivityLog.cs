using System.Reflection.Metadata;
using System.Text.Json.Serialization;
using PowerOfAttorneyAgent.Services;
using PowerOfAttorneyAgent.Model;

namespace Bots;

public class ActivityLog : IMessage
{

    private readonly Guid _documentId;
    public ActivityLog(Guid documentId)
    {
        _documentId = documentId;
    }

    [JsonPropertyName("requestId")]
    public string? RequestId { get; set; }

    public async Task<ActivityLog> WithValidatedDocument()
    {
        var documentService = new DocumentService();
        AuditResult = await documentService.ValidateDocument(_documentId);
        return this;
    }

    [JsonPropertyName("messageType")]
    public string MessageType { get; } = typeof(ActivityLog).Name;

    [JsonPropertyName("summary")]
    public string Summary { get; set; } = string.Empty;

    [JsonPropertyName("details")]
    public string Details { get; set; } = string.Empty;

    [JsonPropertyName("auditResult")]
    public AuditResult<PowerOfAttorney> AuditResult { get; set; } = default!;

    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}