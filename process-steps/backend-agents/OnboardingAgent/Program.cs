using DotNetEnv;
using XiansAi.Flow;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("Onboarding Agent");

var bot = agent.AddBot<OnboardingBot>();
bot.AddCapabilities(typeof(GeneralCapabilities));

await agent.RunAsync();