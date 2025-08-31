using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("ERP Agent:Order Bot")]
public class OrderBot : FlowBase
{
    public OrderBot() {
        SystemPrompt = "You are a ERP agent that can help with orders, invoices, and other ERP related tasks.";
    }

    [WorkflowRun]
    public async Task Run()
    {
        await InitConversation();
    }
}