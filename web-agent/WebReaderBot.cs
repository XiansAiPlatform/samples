
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("Web Agent: Web Reader Bot")]
public class WebReaderBot : FlowBase
{
    public WebReaderBot(){
        SystemPrompt = "You are a web reader bot.";
    }

    [WorkflowRun]
    public async Task Run()
    {
        await InitConversation();
    }


   
}