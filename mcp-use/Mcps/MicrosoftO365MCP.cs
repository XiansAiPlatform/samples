
using DotNetEnv;
using Microsoft.SemanticKernel;
using ModelContextProtocol.Client;
using XiansAi.Flow;

public class MicrosoftO365MCP : IKernelModifier
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
        Console.WriteLine($"Adding Microsoft O365 Functions: {functions.Count}");

        kernel.Plugins.AddFromFunctions("server_microsoft_o365", functions);

        return kernel;
    }

#pragma warning restore SKEXP0001

    public static async Task<IMcpClient> GetMCPClient()
    {
        var clientTransport = new StdioClientTransport(new StdioClientTransportOptions
        {
            Name = "server_microsoft_o365",
            Command = "npx",
            Arguments = new List<string>() {
                "-y",
                "@99xio/mcp-msgraph",
            },
            EnvironmentVariables = new Dictionary<string, string?>
            {
                { "CLIENT_ID", Env.GetString("MS365_MCP_CLIENT_ID") },
                { "CLIENT_SECRET", Env.GetString("MS365_MCP_CLIENT_SECRET") },
                { "TENANT_ID", Env.GetString("MS365_MCP_TENANT_ID") }
            }
        });

        var client = await McpClientFactory.CreateAsync(clientTransport);

        return client;
    }
}

