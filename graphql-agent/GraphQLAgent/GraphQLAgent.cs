using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Flow.Router;

[Workflow($"{Constants.ApplicationName}: Main Agent")]
public class GraphQLAgent : FlowBase
{
    public GraphQLAgent()
    {
        SystemPromptName = Constants.GraphQLAgentPrompt;

        // Configure Azure OpenAI for this agent
        AgentContext.RouterOptions = new RouterOptions
        {
            ProviderName = "openai",
            ApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY"),
            ModelName = "gpt-4.1"
        };
    }

    [WorkflowRun]
    public async Task Run()
    {

        await InitConversation();
    }
}

