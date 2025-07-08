using PowerOfAttorneyAgent.Bots;
using Temporalio.Workflows;
using XiansAi.Flow;

namespace PowerOfAttorneyAgent.Flows;

[Workflow("Power of Attorney Agent v1.2:Legal Review Flow")]
public class LegalReviewFlow : FlowBase
{
    public LegalReviewFlow()
    {
        _messageHub.SubscribeFlowMessageHandler<LegalReviewFlowMessage>( (message) =>
        {
            Console.WriteLine($"################# Flow Message Received: {message.Payload.DocumentId}");
        });
    }


    [WorkflowRun]
    public Task Run()
    {
        return Task.CompletedTask;
    }
} 