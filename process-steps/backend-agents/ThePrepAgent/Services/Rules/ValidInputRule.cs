using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;

namespace PowerOfAttorneyAgent.Validations;

/// <summary>
/// Rule that ensures all required fields are properly filled out
/// </summary>
public class ValidInputRule : BaseRule
{
    public override string Description => "Input Fields Compliance by ensuring that all required information is provided.";
    public override string Link => "https://theprep.ai";

    protected override void ApplyRule(PowerOfAttorney document, AuditResult<PowerOfAttorney> result)
    {
        var powerOfAttorney = document;

        // Validate Principal
        ValidatePrincipal(powerOfAttorney.Principal, result);

        // Validate Scope
        if (!IsValidString(powerOfAttorney.Scope))
        {
            result.AddFinding(
                new Finding(
                    FindingType.Error, 
                    $" {Description} - Power of Attorney scope is required in the document. Non recoverable error.", 
                    Description, 
                    Link));
        }

    }

    private void ValidatePrincipal(Principal? principal, AuditResult<PowerOfAttorney> result)
    {
        if (principal == null)
        {
            result.AddFinding(
                new Finding(
                    FindingType.Error, 
                    $" {Description} - Principal information is required. Non recoverable error.", 
                    Description, 
                    Link));
            return;
        }

        if (!IsValidString(principal.FullName))
        {
            result.AddFinding(
                new Finding(
                    FindingType.Error, 
                    $" {Description} - Principal full name is required. Non recoverable error.", 
                    Description, 
                    Link));
        }

        if (!IsValidString(principal.NationalId))
        {
            result.AddFinding(
                new Finding(
                    FindingType.Error, 
                    $" {Description} - Principal National ID is required. Non recoverable error.", 
                    Description, 
                    Link));
        }

        if (!IsValidString(principal.Address))
        {
            result.AddFinding(
                new Finding(
                    FindingType.Error, 
                    $" {Description} - Principal address is required. Non recoverable error.", 
                    Description, 
                    Link));
        }

        // Warnings for brief information
        if (principal.FullName?.Trim().Length < 4)
        {
            result.AddFinding(
                new Finding(
                    FindingType.Warning, 
                    $"Principal full name appears very brief", 
                    Description, 
                    Link));
        }

        if (principal.Address?.Trim().Length < 10)
        {
            result.AddFinding(
                new Finding(
                    FindingType.Warning, 
                    $"Principal address appears very brief", 
                    Description, 
                    Link));
        }
    }
} 