using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;

namespace PowerOfAttorneyAgent.Validations;

/// <summary>
/// Rule that enforces the maximum number of representatives (3)
/// </summary>
public class MaximumRepresentativesRule : BaseRule
{
    public override string Description => "At least one representative is required. Recommended maximum number of representatives is 3.";
    public override string Link => "https://theprep.ai";

    protected override void ApplyRule(PowerOfAttorney document, AuditResult<PowerOfAttorney> result)
    {
        var representatives = document.Representatives;
        const int maxRepresentatives = 3;

        if (representatives.Count < 1)
        {
            result.AddFinding(
                new Finding(
                    FindingType.Error, 
                    "No representatives found. At least one required", 
                    Description, 
                    Link,
                    new List<CorrectiveAction> {
                        new CorrectiveAction {
                            Title = "Add a close relative",
                            Scope = Scope.RepresentativeBot, 
                            Prompt = @"Add one of the close relatives as an authorized representative of me.
                            Feel free to add one from the list of acquaintances."
                        }
                    }));
        }

        if (representatives.Count > maxRepresentatives)
        {
            result.AddFinding(
                new Finding(
                    FindingType.Recommendation, 
                    $"Maximum number of representatives exceeded. Found {representatives.Count}, maximum allowed is {maxRepresentatives}", 
                    Description, 
                    Link));
        }

        // Add warnings/information as representatives approach the limit
        if (representatives.Count == maxRepresentatives)
        {
            result.AddFinding(
                new Finding(
                    FindingType.Information, 
                    $"Document has reached the maximum number of representatives ({maxRepresentatives})", 
                    Description, 
                    Link));
        }
        else if (representatives.Count == maxRepresentatives - 1)
        {
            result.AddFinding(
                new Finding(
                    FindingType.Information, 
                    $"Document has {representatives.Count} representatives. More can be added (maximum {maxRepresentatives})", 
                    Description, 
                    Link));
        }
    }
} 