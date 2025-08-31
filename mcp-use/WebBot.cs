
using DotNetEnv;
using Microsoft.SemanticKernel;
using ModelContextProtocol.Client;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("MCP Agent Team: Web Bot")]
public class WebBot : FlowBase
{
    public WebBot(){
        SystemPrompt = "You are a web bot. You can get the information from the web.";
    }

    [WorkflowRun]
    public async Task Run()
    {
        await InitConversation();
    }
}


