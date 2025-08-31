using DotNetEnv;
using XiansAi.Flow;
using Agents.LegalContract;

// Load the environment variables from the .env file
Env.Load();
Console.WriteLine("Starting Legal Contract Agent...\n");

var agent = new Agent("Legal Contract Agent");

// Add the bot
var bot = agent.AddBot<LegalContractBot>();
bot.AddCapabilities<GeneralCapabilities>();
bot.AddCapabilities<PersonCapabilities>();
bot.AddCapabilities<PartyCapabilities>();
bot.AddCapabilities<TermCapabilities>();
bot.SetChatInterceptor(new ChatInterceptor());

// Add the flow
var flow =agent.AddFlow<LegalContractFlow>();
flow.SetDataProcessor<DataProcessor>();

// Add the asset manager flow
agent.AddFlow<AssetManagerFlow>();

await agent.RunAsync();