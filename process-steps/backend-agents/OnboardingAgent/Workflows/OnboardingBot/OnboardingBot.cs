using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("Onboarding Agent:Onboarding Bot")]
public class OnboardingBot : FlowBase
{

    [WorkflowRun]
    public async Task Run()
    {
        string sysPrompt = "You are a onboarding bot to assist new customers with their onboarding process.";
        await InitConversation(sysPrompt);
    }
}