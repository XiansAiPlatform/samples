using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("Web Agent");

var bot = agent.AddBot<WebReaderBot>();
bot.AddKernelModifier(new PlayWriteMCP());

await agent.RunAsync();