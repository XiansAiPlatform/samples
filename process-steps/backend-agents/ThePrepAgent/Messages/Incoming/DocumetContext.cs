using System.Text.Json;
using System.Text.Json.Serialization;
using Bots;
using XiansAi.Messaging;

public class DocumentContext: IMessage
{
    [JsonPropertyName("messageType")]
    public string MessageType => typeof(DocumentContext).Name;

    [JsonPropertyName("requestId")]
    public string? RequestId { get; set; }

    [JsonPropertyName("documentId")]
    public required Guid DocumentId { get; set; }

    public static DocumentContext FromThread(MessageThread thread)
    {
        var data = thread.LatestMessage.Data;
        if (data == null)
        {
            throw new Exception($"Metadata not found in message received. MessageThread: {thread.ThreadId}");
        }
        return FromJson(data.ToString() ?? throw new Exception("Failed to convert metadata to string"));
    }

    public static DocumentContext FromJson(string json)
    {
        return JsonSerializer.Deserialize<DocumentContext>(json) ?? throw new Exception("Failed to deserialize metadata");
    }

    public string ToJson()
    {
        return JsonSerializer.Serialize(this);
    }
}