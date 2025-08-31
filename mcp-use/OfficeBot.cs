using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("MCP Agent Team: Office Bot")]
public class OfficeBot : FlowBase
{
    public OfficeBot(){
        RouterOptions.ModelName = "gpt-4o-mini";
        SystemPrompt = @"
        You are an Office Bot with comprehensive Microsoft 365 organizational capabilities. 
        You have access to the MS O365 graph API through a MCP server.
        
        IMPORTANT: When using Microsoft Graph API tools:
        - Structure your requests according to Microsoft Graph API schema
        ";
    }

    [WorkflowRun]
    public async Task Run()
    {
        await InitConversation();
    }
}


