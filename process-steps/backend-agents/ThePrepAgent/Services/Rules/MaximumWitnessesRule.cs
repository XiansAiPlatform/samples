using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;

namespace PowerOfAttorneyAgent.Validations;

/// <summary>
/// Rule that enforces the maximum number of witnesses (2)
/// </summary>
public class WitnessesCountRule : BaseRule
{
    public override string Description => "Maximum Witnesses Limit by ensuring that a Power of Attorney document does not exceed the maximum allowed number of witnesses (2)";
    public override string Link => "https://theprep.ai";

    protected override void ApplyRule(PowerOfAttorney document, AuditResult<PowerOfAttorney> result)
    {
        var witnesses = document.Witnesses;
        const int maxWitnesses = 2;

        if (witnesses.Count > maxWitnesses)
        {
            result.AddFinding(
                new Finding(
                    FindingType.Recommendation, 
                    $"Maximum recommended number of witnesses exceeded. Found {witnesses.Count}, maximum recommended is {maxWitnesses}", 
                    Description, 
                    Link));
        }
        if (witnesses.Count == 0)
        {
            result.AddFinding(
                new Finding(
                    FindingType.Error, 
                    $"At least one witness is required", 
                    Description, 
                    Link));
        }
        else if (witnesses.Count == 1)
        {
            result.AddFinding(
                new Finding(
                    FindingType.Recommendation, 
                    $"Document has 1 witness. One more can be added if desired", 
                    Description, 
                    Link));
        }
    }
} 