
using Microsoft.SemanticKernel;
using ModelContextProtocol.Client;
using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("A2A Agent Team: Web Bot")]
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


public class PlayWriteMCP : IKernelModifier
{
    private static List<KernelFunction>? functions;
    private static List<string> arguments = new List<string>() {
        "-y",
        "@playwright/mcp@latest",
        "--isolated",
    };
    public PlayWriteMCP(bool headless = true)
    {
        if (headless)
        {
           // arguments.Add("--headless");
        }
    }

#pragma warning disable SKEXP0001
    public async Task<Kernel> ModifyKernelAsync(Kernel kernel)
    {
        if (functions == null)
        {
            var client = await GetMCPClientForPlaywright();
            var tools = await client.ListToolsAsync();
            functions = tools.Select(f => f.AsKernelFunction()).ToList();
        }
        Console.WriteLine($"Adding Playwright Functions: {functions.Count}");

        kernel.Plugins.AddFromFunctions("Playwright", functions);

        return kernel;
    }

#pragma warning restore SKEXP0001


    public static async Task<IMcpClient> GetMCPClientForPlaywright()
    {
        var clientTransport = new StdioClientTransport(new StdioClientTransportOptions
        {
            Name = "Playwright",
            Command = "npx",
            Arguments = arguments,
        });

        var client = await McpClientFactory.CreateAsync(clientTransport);

        return client;
    }
}