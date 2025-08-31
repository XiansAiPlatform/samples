using System.Text.Json;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("A2A Agent Team: Webhook Bot")]
public class WebhookBot : FlowBase
{
    [WorkflowRun]
    public async Task Run()
    {
        await InitWebhookProcessing();
    }

    /// <summary>
    /// This is a webhook bot that will be used to process the webhook from the email server. Can be invoked with the below URL:
    /// http://localhost:5000/api/user/webhooks/A2A Agent Team: Webhook Bot/mail-received?apikey=<apikey>&tenantId=default&param=param-value
    /// </summary>
    /// <param name="queryParams"></param>
    /// <param name="body"></param>
    /// <returns></returns>
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


