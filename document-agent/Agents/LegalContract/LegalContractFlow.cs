using Temporalio.Workflows;
using XiansAi.Flow;

namespace Agents.LegalContract;

[Workflow("Legal Contract Agent:Legal Contract Flow")]
public class LegalContractFlow : FlowBase
{

    [WorkflowRun]
    public async Task Run()
    {
        await InitDataProcessing();
    }
}
