using XiansAi.Flow;
using DotNetEnv;
using PowerOfAttorneyAgent.Bots;
using PowerOfAttorneyAgent.Flows;

// Load the environment variables from the .env file
Env.Load();

// name your agent
var agent = new Agent("Power of Attorney Agent v1.2");

// add bots
var representativeBot = agent.AddBot<RepresentativeBot>();
representativeBot.AddCapabilities(typeof(RepresentativeCapabilities));
representativeBot.AddCapabilities(typeof(DocumentCapabilities));
representativeBot.AddCapabilities(typeof(RepresentativeHandoffCapabilities));

var conditionBot = agent.AddBot<ConditionBot>();
conditionBot.AddCapabilities(typeof(ConditionCapabilities));
conditionBot.AddCapabilities(typeof(DocumentCapabilities));
conditionBot.AddCapabilities(typeof(ConditionHandoffCapabilities));

var witnessBot = agent.AddBot<WitnessBot>();
witnessBot.AddCapabilities(typeof(WitnessCapabilities));
witnessBot.AddCapabilities(typeof(DocumentCapabilities));
witnessBot.AddCapabilities(typeof(WitnessHandoffCapabilities));

// add flows
var documentDataFlow = agent.AddFlow<DocumentDataFlow>();
documentDataFlow.AddActivities<IDocumentDataActivities, DocumentDataActivities>();

var legalReviewFlow = agent.AddFlow<LegalReviewFlow>();

await agent.RunAsync();
