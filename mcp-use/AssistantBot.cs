using System.Text.Json;
using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Flow.Router.Plugins;
using XiansAi.Logging;
using XiansAi.Messaging;

[Workflow("MCP Agent Team: Assistant Bot")]
public class AssistantBot : FlowBase
{
    public AssistantBot()
    {
        SystemPrompt = "You are a assistant bot.";
    }

    [WorkflowRun]
    public async Task Run()
    {
        await InitConversation();
    }
}
