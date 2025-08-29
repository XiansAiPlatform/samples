
using DotNetEnv;
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


public class WebAutomationMCP : IKernelModifier
{
    private static List<KernelFunction>? functions;
    private static List<string> arguments = new List<string>() {
        "-y",
        "@playwright/mcp@latest",
        "--isolated",
    };
    public WebAutomationMCP()
    {
        var headless = Env.GetString("HEADLESS") == "true";
        if (headless)
        {
           arguments.Add("--headless");
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


public class WebSearchMCP : IKernelModifier
{
    private static List<KernelFunction>? functions;

#pragma warning disable SKEXP0001
    public async Task<Kernel> ModifyKernelAsync(Kernel kernel)
    {
        if (functions == null)
        {
            var client = await GetMCPClient();
            var tools = await client.ListToolsAsync();
            functions = tools.Select(f => f.AsKernelFunction()).ToList();
        }
        Console.WriteLine($"Adding Web Search Functions: {functions.Count}");

        kernel.Plugins.AddFromFunctions("brave_web_search", functions);

        return kernel;
    }

#pragma warning restore SKEXP0001

    public static async Task<IMcpClient> GetMCPClient()
    {
        var clientTransport = new StdioClientTransport(new StdioClientTransportOptions
        {
            Name = "Brave search",
            Command = "npx",
            Arguments = new List<string>() {
                "-y",
                "@modelcontextprotocol/server-brave-search"
            },
            EnvironmentVariables = new Dictionary<string, string?>
            {
                { "BRAVE_API_KEY", Env.GetString("BRAVE_API_KEY") }
            }
        });

        var client = await McpClientFactory.CreateAsync(clientTransport);

        return client;
    }
}

