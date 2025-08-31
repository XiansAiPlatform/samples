using XiansAi.Flow;
using DotNetEnv;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("Invoice Agent");

var approvalFlow = agent.AddFlow<InvoiceApprovalFlow>();

var userRequestFlow = agent.AddFlow<UserRequestFlow>();
//userRequestFlow.SetScheduleProcessor<ScheduledProcessor>(processInWorkflow: true, startAutomatically: true);
//userRequestFlow.AddActivities<Activities>(new Activities());

await agent.RunAsync();