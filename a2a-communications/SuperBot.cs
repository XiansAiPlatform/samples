using System.Text.Json;
using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Flow.Router.Plugins;
using XiansAi.Logging;
using XiansAi.Messaging;

[Workflow("A2A Agent Team: Super Bot")]
public class SuperBot : FlowBase
{
    public SuperBot()
    {
        SystemPrompt = "You are a super bot. Call the sub bots to do the work.";
    }

    [WorkflowRun]
    public async Task Run()
    {
        await InitConversation();
    }
}


public static class SuperBotCapabilities
{
    private static readonly Logger<object> _logger = Logger<object>.For();

    [Capability("Get company information")]
    [Parameter("companyName", "Name of the company to get information about")]
    [Returns("Markdown formatted company information")]
    public static async Task<string> FindCompanyInformation(string companyName)
    {
        _logger.LogInformation($"Getting company information for {companyName}");

        // Extract the company information from the Proff URL
        var companyInfo = await ExtractCompanyInformation(companyName);
        _logger.LogInformation($"Company information: {companyInfo}");
        return companyInfo;
    }


    [Capability("Detect nationality")]
    [Parameter("name", "Name of the person to detect nationality about")]
    [Returns("Json formatted probability of nationality information")]
    public static async Task<string> DetectNationality(string name)
    {
        _logger.LogInformation($"Detecting nationality for {name}");

        // Call the API bot to detect nationality
        var methodName = "DetectNationality";
        var nationality = await MessageHub.Agent2Agent.SendData(typeof(ApiBot), name, methodName);
        _logger.LogInformation($"Nationality: {nationality.Data}");

        return JsonSerializer.Serialize(nationality.Data);
    }

    private static async Task<string> ExtractCompanyInformation(string companyName)
    {
        var prompt = @$"search web for `{companyName} site:proff.no`. 
            Find the link to the first search result and goto the Proff page of the company. 
            Find as much as company information and present in Markdown format.
            If failed, return exactly ‘ERROR: <reason>’ only
            ";
        var webContent = await MessageHub.Agent2Agent.SendChat(typeof(WebBot), prompt);
        return webContent.Text;
    }
}
