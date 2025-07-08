using System.Text.Json;
using XiansAi.Messaging;

public interface IMessage
{
    string MessageType { get; }

    string? RequestId { get; set; }
}

public class Message
{
    public static Message FromJson(string json)
    {
        return JsonSerializer.Deserialize<Message>(json) ?? throw new Exception("Failed to deserialize message");
    }

    public static Message FromJson(JsonElement json)
    {
        return JsonSerializer.Deserialize<Message>(json) ?? throw new Exception("Failed to deserialize message");
    }

    public static string GetMessageType(MessageThread messageThread)
    {
        if (messageThread.LatestMessage.Data is not JsonElement metadata)
        {
            throw new Exception("Metadata is not a JsonElement");
        }

        return metadata.GetProperty("messageType").GetString() ?? throw new Exception("Failed to get message type");
    }

}