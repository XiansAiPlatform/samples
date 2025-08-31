using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("Invoice Agent:User Request Flow")]
public class UserRequestFlow : FlowBase
{
  private int _count = 0;

  [WorkflowRun]
  public async Task Run()
  {
    await InitSchedule();
  }
  
  public int IncrementCount()
  {
    _count++;
    return _count;
  }

}
