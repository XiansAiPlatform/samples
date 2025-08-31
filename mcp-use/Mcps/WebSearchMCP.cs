
using DotNetEnv;
using Microsoft.SemanticKernel;
using ModelContextProtocol.Client;
using XiansAi.Flow;

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

