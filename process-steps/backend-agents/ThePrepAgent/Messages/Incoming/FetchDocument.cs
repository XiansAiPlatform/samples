using System.Text.Json;
using System.Text.Json.Serialization;
using Bots;
using XiansAi.Messaging;

public class FetchDocument: IMessage
{
    [JsonPropertyName("messageType")]
    public string MessageType => typeof(FetchDocument).Name;

    [JsonPropertyName("requestId")]
    public string? RequestId { get; set; }

    [JsonPropertyName("documentId")]
    public required Guid DocumentId { get; set; }

    public static FetchDocument FromThread(MessageThread thread)
    {
        var metadata = thread.LatestMessage.Data;
        if (metadata == null)
        {
            throw new Exception($"Metadata not found in message received. MessageThread: {thread.ThreadId}");
        }
        return JsonSerializer.Deserialize<FetchDocument>(metadata.ToString() ?? throw new Exception("Failed to convert metadata to string")) ?? throw new Exception("Failed to deserialize metadata");
    }

}