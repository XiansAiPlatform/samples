using XiansAi.Flow;
using XiansAi.Logging;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

var logger = Logger<Program>.For();
logger.LogInformation("MongoDB Vector Indexing Agent");
logger.LogInformation("============================");

// Create and run the agent
var agent = new Agent("Indexing Agent");

var flow = agent.AddFlow<IndexingFlow>();
flow.SetScheduleProcessor<ScheduledProcessor>(
    processInWorkflow: false, 
    startAutomatically: true,
    runAtStart: true);

await agent.RunAsync();