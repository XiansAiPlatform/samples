using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("MCP Agent Team");

var superBot = agent.AddBot<AssistantBot>();
superBot.AddKernelModifier(new PdfGeneratorMCP());


var webBot = agent.AddBot<WebBot>();
webBot.AddKernelModifier(new WebAutomationMCP());
webBot.AddKernelModifier(new WebSearchMCP());

var webhookBot = agent.AddBot<WebhookBot>();

var officeBot = agent.AddBot<OfficeBot>();
officeBot.AddKernelModifier(new MicrosoftO365MCP());

await agent.RunAsync();