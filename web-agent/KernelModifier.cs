using Microsoft.SemanticKernel;
using ModelContextProtocol.Client;
using XiansAi.Flow;

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
        functions = new List<KernelFunction>();
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