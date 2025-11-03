using XiansAi.Flow;
using DotNetEnv;
using XiansAi.Flow.Router;
using AgentTools;
using GqlIntrospection;

// Parse command line arguments
var cmdArgs = Environment.GetCommandLineArgs();
string envFile = ".env"; // default

// Check for --env-file flag
if (cmdArgs.Contains("--env-file"))
{
	var envFileIndex = Array.IndexOf(cmdArgs, "--env-file");
	if (envFileIndex >= 0 && envFileIndex + 1 < cmdArgs.Length)
	{
		envFile = cmdArgs[envFileIndex + 1];
	}
}

// Load the environment variables from the specified file
Console.WriteLine($"Loading environment from: {envFile}");
if (File.Exists(envFile))
{
	Env.Load(envFile);
}
else
{
	Console.WriteLine($"Warning: Environment file '{envFile}' not found. Using system environment variables only.");
}

// Configure router options if custom OpenAI API key is provided
if (Env.GetString(Constants.EnvOpenAIApiKey) != null)
{
	Console.WriteLine("Setting Router Options with a custom OPENAI_API_KEY");
	AgentContext.RouterOptions = new RouterOptions
	{
		ProviderName = Constants.ProviderOpenAI,
		ApiKey = Env.GetString(Constants.EnvOpenAIApiKey),
		ModelName = Constants.ModelGpt4oMini,
	};
}

var options = new RunnerOptions
{
	SystemScoped = true
};

// Set onboarding configuration with embedded knowledge base
options.SetOnboardingJsonWithAssembly(Onboarding.GraphQLAgent);

// Create the agent team
var agentTeam = new AgentTeam(Constants.ApplicationName, options);

// Add the main GraphQL agent
var graphQLAgent = agentTeam.AddAgent<GraphQLAgent>();
graphQLAgent.AddCapabilities(typeof(GraphQLCapabilities));

graphQLAgent.AddCapabilities(typeof(SchemaCapabilities));

// Pre-fetch schema for SystemScoped agents to avoid cold start delay
if (options.SystemScoped)
{
	try
	{
		var svc = new GraphQLIntrospectionService();
		var json = await svc.FetchSchemaAsync();
		var ttlMinutesEnv = Environment.GetEnvironmentVariable("SCHEMA_CACHE_TTL_MINUTES");
		var ttl = int.TryParse(ttlMinutesEnv, out var v) && v > 0 ? v : 5760; // default 4 days
		SchemaCache.Set(json, TimeSpan.FromMinutes(ttl));
		Console.WriteLine($"[Schema] Pre-cached for SystemScoped agent. TTL={ttl} minutes. Size: {json.Length} chars");
	}
	catch (Exception ex)
	{
		Console.WriteLine($"[Schema] Pre-cache failed: {ex.Message}. Agent will auto-refresh on first use.");
	}
}

// Run the agent team
Console.WriteLine("Starting GraphQL Database Agent...");
await agentTeam.RunAsync();
