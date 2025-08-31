using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("ERP Agent");

var bot = agent.AddBot<OrderBot>();
bot.AddCapabilities(typeof(OrderCapabilities));

await agent.RunAsync();