
using DotNetEnv;
using Microsoft.SemanticKernel;
using ModelContextProtocol.Client;
using XiansAi.Flow;

public class WebAutomationMCP : IKernelModifier
{
    private static List<KernelFunction>? functions;

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
            Arguments = new List<string>() {
                "-y",
                "@playwright/mcp@latest",
                "--isolated",
                (Env.GetString("HEADLESS") == "true") ? "--headless" : ""
            },
        });

        var client = await McpClientFactory.CreateAsync(clientTransport);

        return client;
    }
}
