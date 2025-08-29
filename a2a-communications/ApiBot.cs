using Temporalio.Workflows;
using XiansAi.Flow;

[Workflow("A2A Agent Team: API Bot")]
public class ApiBot : FlowBase
{
    [WorkflowRun]
    public async Task Run()
    {
        await InitDataProcessing();
    }
}


public class ApiDataProcessor 
{
    public async Task<string> DetectNationality(string name)
    {
        //https://api.nationalize.io/?name=abhishek
        var client = new HttpClient();
        var response = await client.GetAsync($"https://api.nationalize.io/?name={name}");
        var jsonContent = await response.Content.ReadAsStringAsync();
        
        return jsonContent;
    }
    
}
