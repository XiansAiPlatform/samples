using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("A2A Agent Team");

var superBot = agent.AddBot<SuperBot>();
superBot.AddCapabilities(typeof(SuperBotCapabilities));
superBot.AddKernelModifier(new PdfGeneratorMCP());


var webBot = agent.AddBot<WebBot>();
webBot.AddKernelModifier(new WebAutomationMCP());
webBot.AddKernelModifier(new WebSearchMCP());

var apiBot = agent.AddBot<ApiBot>();
apiBot.SetDataProcessor<ApiDataProcessor>();

await agent.RunAsync();