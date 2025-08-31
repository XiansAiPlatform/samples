using System.Text.Json;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("MCP Agent Team: Webhook Bot")]
public class WebhookBot : FlowBase
{
    [WorkflowRun]
    public async Task Run()
    {
        await InitWebhookProcessing();
    }

    [WorkflowUpdate("mail-received")]
    public async Task<string> MailReceived(IDictionary<string, string> queryParams, string body)
    {
        // Delay for 1 second
        await Workflow.DelayAsync(TimeSpan.FromSeconds(1));
        Console.WriteLine("Mail received");
        Console.WriteLine(JsonSerializer.Serialize(queryParams));
        Console.WriteLine(body);
        return body;
    }
}


