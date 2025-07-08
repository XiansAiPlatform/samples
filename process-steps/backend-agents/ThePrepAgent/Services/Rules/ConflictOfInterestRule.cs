using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;

namespace PowerOfAttorneyAgent.Validations;

/// <summary>
/// Rule that prevents conflicts of interest by ensuring the same person doesn't occupy multiple roles
/// </summary>
public class ConflictOfInterestRule : BaseRule
{
    public override string Description => "Conflict of Interest Prevention by ensuring that the same person does not serve on conflicting roles simultaneously";
    public override string Link => "https://theprep.ai";

    protected override void ApplyRule(PowerOfAttorney document, AuditResult<PowerOfAttorney> result)
    {
        var principal = document.Principal;
        var representatives = document.Representatives;
        var witnesses = document.Witnesses;

        // Check if principal is also a representative
        if (principal != null && !string.IsNullOrWhiteSpace(principal.NationalId))
        {
            var principalAsRep = representatives.FirstOrDefault(r => 
                r.NationalId?.Equals(principal.NationalId, StringComparison.OrdinalIgnoreCase) ?? false);
            
            if (principalAsRep != null)
            {
                result.AddFinding(
                    new Finding(
                        FindingType.Error, 
                        $"Principal '{principal.FullName}' cannot also be a representative. Found as representative: '{principalAsRep.FullName}'", 
                        Description, 
                        Link,
                        new List<CorrectiveAction> { 
                            new CorrectiveAction { 
                                Title = "Remove Principal as Representative", 
                                Prompt = $"Remove {principal.FullName} from the representatives list",
                                Scope = Scope.RepresentativeBot
                            } 
                        }));
            }

            var principalAsWitness = witnesses.FirstOrDefault(w => 
                w.NationalIdNumber.Equals(principal.NationalId, StringComparison.OrdinalIgnoreCase));
            
            if (principalAsWitness != null)
            {
                result.AddFinding(
                    new Finding(
                        FindingType.Error, 
                        $"Principal '{principal.FullName}' cannot also be a witness. Found as witness: '{principalAsWitness.FullName}'", 
                        Description, 
                        Link));
            }
        }

        // Check if any representative is also a witness
        foreach (var representative in representatives)
        {
            var matchingWitness = witnesses.FirstOrDefault(w => 
                w.NationalIdNumber.Equals(representative.NationalId, StringComparison.OrdinalIgnoreCase) ||
                w.FullName.Equals(representative.FullName, StringComparison.OrdinalIgnoreCase));

            if (matchingWitness != null)
            {
                result.AddFinding(
                    new Finding(
                        FindingType.Warning, 
                        $"Representative '{representative.FullName}' is also listed as witness '{matchingWitness.FullName}'. " +
                        "This may create a conflict of interest and should be reviewed", 
                        Description, 
                        Link,
                        new List<CorrectiveAction> { 
                            new CorrectiveAction { 
                                Title = $"Remove {representative.FullName}", 
                                Prompt = $"Remove {representative.FullName} from the representative list",
                                Scope = Scope.RepresentativeBot
                            } 
                        }));
            }
        }

        // Add information about role separation
        var totalPeople = 1 + representatives.Count + witnesses.Count; // 1 for principal
        result.AddFinding(
            new Finding(
                FindingType.Information, 
                $"In Norway 70% of the time, at least one representative is also a witness.", 
                Description, 
                Link));
    }

    private int GetRoleCount(PowerOfAttorney document)
    {
        int roleCount = 1; // Principal is always present
        if (document.Representatives.Count > 0) roleCount++;
        if (document.Witnesses.Count > 0) roleCount++;
        return roleCount;
    }
} 