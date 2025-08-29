
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
    public static async Task<string> GetCompanyInformation(string companyName)
    {
        _logger.LogInformation($"Getting company information for {companyName}");

        // Find the Proff URL via google search
        var proffURL = await ProffCompanyInfo.FindProffURL(companyName);
        _logger.LogInformation($"Proff URL: {proffURL}");

        // If the Proff URL is not found, throw an error
        if (proffURL.Contains("ERROR")) {
            throw new Exception(proffURL);
        }

        // Extract the company information from the Proff URL
        var companyInfo = await ProffCompanyInfo.ExtractCompanyInformation(proffURL);
        _logger.LogInformation($"Company information: {companyInfo}");
        return companyInfo;
    }

}


public static class ProffCompanyInfo
{

    public static async Task<string> ExtractCompanyInformation(string proffURL)
    {
        var prompt = @$"
                1. Visit url '{proffURL}'
                2. Extract all the key information about the company
                5. Note that the financial information is in whole 1000s. Therefore multiply by 1000 to get the actual value
                6. Present in Markdown format
                7. If failed, return exactly ‘ERROR: <reason>’ only
            ";
        var webContent = await MessageHub.Agent2Agent.SendChat(typeof(WebBot), prompt);
        return webContent.Text;
    }
    public static async Task<string> FindProffURL(string companyName)
    {
        if (!companyName.Contains("AS"))
        {
            companyName = $"{companyName} AS";
        }
        var prompt = @$"
                1. Perform a google search for '{companyName} site:proff.no'
                2. Find the result that is most likely to be the company's proff.no page
                3. Return the URL of the result. Do not include any other text.
                4. If failed, return 'ERROR: <reason>' only
            ";
        var webContent = await MessageHub.Agent2Agent.SendChat(typeof(WebBot), prompt);
        return webContent.Text ?? "ERROR: Failed to find Proff URL due to no search result";
    }
}