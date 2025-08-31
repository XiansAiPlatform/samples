using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Messaging;

namespace Agents.LegalContract;

[Workflow("Legal Contract Agent:Legal Contract Bot")]
public class LegalContractBot : FlowBase
{
    SafeHandler safeHandler = new SafeHandler();
    
    public LegalContractBot(){
        SystemPromptName = "Legal Contract Bot";
        RouterOptions = new XiansAi.Flow.Router.RouterOptions {
            ModelName = "o3-mini"
        };
    }

    [WorkflowRun]
    public async Task Run()
    {
        await InitConversation();
    }

    // [WorkflowUpdate]
    // public async Task<string?> SendReceiveMessage(string participantId, string message, int timeoutSeconds = 10) {
    //     Console.WriteLine($"Legal Contract Bot: Sending message: {message} to participant: {participantId}");
    //     // Send message to participant
    //     var requestId = await MessageHub.Agent2User.SendChat(participantId, message);
    //     string? response = message;

    //     // Calculate timeout
    //     var timeout = DateTime.UtcNow.AddSeconds(timeoutSeconds);

    //     // Subscribe to messages
    //     SubscribeToMessages((messageThread) => {    
    //         if(messageThread.LatestMessage.RequestId == requestId && messageThread.ParticipantId == participantId) {
    //             response = messageThread.LatestMessage.Content;
    //         }
    //         return Task.CompletedTask;
    //     });

    //     // Wait for response or timeout
    //     await Workflow.WaitConditionAsync(() => response != null || DateTime.UtcNow >= timeout);

    //     if(response == null) {
    //         throw new TimeoutException($"No response from participant, timeout: {timeoutSeconds} seconds");
    //     }

    //     return response;
    // }
}