using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("Onboarding Agent:Onboarding Flow")]
public class OnboardingFlow : FlowBase
{

    [WorkflowRun]
    public async Task Run()
    {
        await Task.CompletedTask;
    }
}