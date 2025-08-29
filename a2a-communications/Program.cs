using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("A2A Agent Team");

var superBot = agent.AddBot<SuperBot>();
superBot.AddCapabilities(typeof(SuperBotCapabilities));

var webBot = agent.AddBot<WebBot>();
webBot.AddKernelModifier(new PlayWriteMCP());

await agent.RunAsync();