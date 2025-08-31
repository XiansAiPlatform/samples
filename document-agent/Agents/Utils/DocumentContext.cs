using System.Text.Json;
using XiansAi.Logging;
using XiansAi.Messaging;

namespace Agents.Utils;

public class DocumentContext
{
    public Guid? DocumentId { get; set; }

    public string UserId { get; set; }

    public MessageThread? Thread { get; set; }

    private static readonly Logger<DocumentContext> _logger = Logger<DocumentContext>.For();

    public DocumentContext(MessageThread thread)
    {
        Thread = thread;
        UserId = thread.ParticipantId;
        ExtractDocumentId();
    }

    private void ExtractDocumentId()
    {
        var data = Thread?.LatestMessage.Data;

        var json = data?.ToString();

        if (string.IsNullOrEmpty(json))
        {
            _logger.LogWarning($"No data found in the thread. Data: '{data}'");
            return;
        }

        var dataDict = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

        if (dataDict is null)
        {
            _logger.LogWarning($"No documentId found in the data '{data}'");
            return;
        }

        if (dataDict.TryGetValue("documentId", out var documentId))
        {
            DocumentId = Guid.Parse(documentId);
        }
        else
        {
            _logger.LogWarning($"No documentId found in the data '{data}'");
        }
    }
}