
using DotNetEnv;
using Microsoft.SemanticKernel;
using ModelContextProtocol.Client;
using XiansAi.Flow;

public class PdfGeneratorMCP : IKernelModifier
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
        Console.WriteLine($"Adding PDF Generator Functions: {functions.Count}");

        kernel.Plugins.AddFromFunctions("markdown2pdf", functions);

        return kernel;
    }

#pragma warning restore SKEXP0001

    public static async Task<IMcpClient> GetMCPClient()
    {
        var clientTransport = new StdioClientTransport(new StdioClientTransportOptions
        {
            Name = "markdown2pdf",
            Command = "npx",
            Arguments = new List<string>() {
                "@99xio/markdown2pdf-mcp"
            },
            EnvironmentVariables = new Dictionary<string, string?>
            {
                { "M2P_OUTPUT_DIR", Env.GetString("TEMP_DIR") }
            },
            WorkingDirectory = "./"
        });

        var client = await McpClientFactory.CreateAsync(clientTransport);

        return client;
    }
}

