using Microsoft.Extensions.Logging;
using Temporal;
using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Messaging;

namespace Agents.LegalContract;

[Workflow("Legal Contract Agent:Asset Manager Flow")]
public class AssetManagerFlow : FlowBase
{

    SafeHandler safeHandler = new SafeHandler();

    [WorkflowRun]
    public async Task Run()
    {
        Console.WriteLine("Asset Manager Flow: Running");
        while (true)
        {
            // Safe handling
            if(safeHandler.ShouldContinueAsNew)
            {
                safeHandler.ContinueAsNew();
            }
            try
            {
                Console.WriteLine("Asset Manager Flow: Waiting for 5 seconds");
                await Workflow.DelayAsync(TimeSpan.FromSeconds(60));

                // Send Update
                var args = new object?[] { "hasith@gmail.com", "Hello" };
                var response = await MessageHub.SendFlowUpdate<string>(typeof(LegalContractBot), "SendReceiveMessage", args);
                Console.WriteLine($"Asset Manager Flow: Response: {response}");
            }
            catch (Exception ex)
            {
                Workflow.Logger.LogError(ex, "Asset Manager Flow: Error");
                // If there's an error, wait a bit before retrying to avoid tight error loops
                await Workflow.DelayAsync(TimeSpan.FromSeconds(1));
            }
        }

    }
}
