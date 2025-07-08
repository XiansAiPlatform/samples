using System.Collections.Concurrent;
using System.Text.Json;
using Bots;
using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Logging;
using XiansAi.Messaging;

namespace PowerOfAttorneyAgent.Flows;

[Workflow("Power of Attorney Agent v1.2:Document Data Flow")]
public class DocumentDataFlow : FlowBase
{
    // Use Temporal's deterministic WorkflowQueue instead of ConcurrentQueue
    private readonly ConcurrentQueue<MessageThread> _messageQueue = new();
    private static readonly Logger<DocumentDataFlow> _logger = Logger<DocumentDataFlow>.For();
    private readonly ActivityOptions _activityOptions = new()
    {
        ScheduleToCloseTimeout = TimeSpan.FromSeconds(120)
    };

    public DocumentDataFlow()
    {
        _messageHub.SubscribeDataHandler(
            (MessageThread thread) => {
                _logger.LogInformation($"MessageThread received by {nameof(DocumentDataFlow)}: {thread.ThreadId}");
                _messageQueue.Enqueue(thread);
            });
    }

    [WorkflowRun]
    public async Task Run()
    {
        while (true)
        {
            try
            {
                // Dequeue message
                var messageThread = await DequeueMessage();
                if (messageThread == null)
                {
                    continue;
                }
                
                // Get message type
                var messageType = Message.GetMessageType(messageThread);
                _logger.LogInformation($"MessageType: {messageType}");

                // Process message
                if (messageType == nameof(FetchDocument))
                {
                    await HandleDocumentRequest(messageThread);
                }
                else
                {
                    _logger.LogWarning($"MessageType: {messageType} not supported by {nameof(DocumentDataFlow)}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("Error in DocumentDataFlow", ex);
            }
        }
    }

    private async Task<MessageThread?> DequeueMessage()
    {
        // Use WorkflowQueue's async DequeueAsync which is deterministic
        await Workflow.WaitConditionAsync(() => _messageQueue.Count > 0);
        var messageThread = _messageQueue.TryDequeue(out var thread) ? thread : null;
        if (messageThread == null)
        {
            _logger.LogWarning("Null message received from queue");
        }
        return messageThread;
    }

    private async Task HandleDocumentRequest(MessageThread messageThread)
    {
        try
        {
            _logger.LogInformation($"[DocumentDataFlow] Starting HandleDocumentRequest for thread: {messageThread.ThreadId}");
            
            var documentRequest = FetchDocument.FromThread(messageThread);
            _logger.LogInformation($"[DocumentDataFlow] DocumentRequest DocumentId: {documentRequest.DocumentId}, RequestId: {documentRequest.RequestId}");

            _logger.LogInformation($"[DocumentDataFlow] Executing ValidateDocument activity...");
            var result = await Workflow.ExecuteActivityAsync(
                (IDocumentDataActivities act) => act.ValidateDocument(documentRequest.DocumentId), _activityOptions);
            
            _logger.LogInformation($"[DocumentDataFlow] Activity completed successfully. Result: {JsonSerializer.Serialize(result)}");

            _logger.LogInformation($"[DocumentDataFlow] Sending DocumentResponse...");
            await messageThread.SendData(new DocumentResponse {
                AuditResult = result,
                RequestId = documentRequest.RequestId
            });
            _logger.LogInformation($"[DocumentDataFlow] DocumentResponse sent successfully for RequestId: {documentRequest.RequestId}");
        }
        catch (Exception ex)
        {
            _logger.LogError($"[DocumentDataFlow] Error in HandleDocumentRequest: {ex.Message}");
            _logger.LogError($"[DocumentDataFlow] Stack trace: {ex.StackTrace}");
            throw; // Re-throw to maintain original behavior
        }
    }
}