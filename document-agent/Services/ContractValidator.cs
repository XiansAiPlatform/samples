using System.Text.RegularExpressions;
using Microsoft.SemanticKernel;

namespace Services;

// Insight models for validation results
public enum InsightSeverity
{
    Critical,
    Warning,
    Suggestion
}

public class ValidationInsight
{
    public InsightSeverity Severity { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? FieldPath { get; set; }
    public string? SuggestedAction { get; set; }
    public string? Prompt { get; set; }
}

public class ValidationResult
{
    public List<ValidationInsight> Insights { get; set; } = new();
    public bool IsValid => !Insights.Any(i => i.Severity == InsightSeverity.Critical);
    public bool HasWarnings => Insights.Any(i => i.Severity == InsightSeverity.Warning);
    public bool HasSuggestions => Insights.Any(i => i.Severity == InsightSeverity.Suggestion);

    public void AddInsight(InsightSeverity severity, string message, string? fieldPath, string? suggestedAction, string? prompt)
    {
        Insights.Add(new ValidationInsight
        {
            Severity = severity,
            Message = message,
            FieldPath = fieldPath,
            SuggestedAction = suggestedAction,
            Prompt = prompt
        });
    }

    public void AddInsight(ValidationInsight insight)
    {
        Insights.Add(insight);
    }
}

// Base validator interface
public interface IContractSectionValidator
{
    ValidationResult Validate(Contract contract);
}

// Scope validation
public class ScopeValidator : IContractSectionValidator
{
    public ValidationResult Validate(Contract contract)
    {
        var result = new ValidationResult();

        // Critical validations
        if (string.IsNullOrWhiteSpace(contract.Title))
        {
            result.AddInsight(InsightSeverity.Critical,
                "Contract title is required - A clear contract title is essential for legal identification",
                "title", "Add a descriptive contract title", "I want to add a descriptive title to the contract.");
        }

        if (contract.EffectiveDate == null)
        {
            result.AddInsight(InsightSeverity.Critical,
                "Effective date is required - All contracts must have a clear start date",
                "effectiveDate", "Specify when the contract becomes effective", "I want to add an effective date to the contract.");
        }

        if (string.IsNullOrWhiteSpace(contract.Description))
        {
            result.AddInsight(InsightSeverity.Critical,
                "Contract description is required - A description clarifies the contract's purpose",
                "description", "Add a clear description of the contract purpose", "I want to add a clear description of the contract's purpose.");
        }

        // Warning validations
        if (contract.EffectiveDate != null && contract.EffectiveDate < DateTime.UtcNow.Date.AddDays(-30))
        {
            result.AddInsight(InsightSeverity.Warning,
                "Contract effective date is significantly in the past - Backdated contracts may have legal implications",
                "effectiveDate", "Review if backdating is intentional and legally compliant", "I want to review and potentially update the contract's effective date to ensure legal compliance.");
        }

        return result;
    }
}

// Parties validation
public class PartiesValidator : IContractSectionValidator
{
    private readonly Regex _emailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

    public ValidationResult Validate(Contract contract)
    {
        var result = new ValidationResult();
        var parties = contract.Parties;

        // Critical validations
        if (parties.Count < 2)
        {
            result.AddInsight(InsightSeverity.Critical,
                "Contract must have at least two parties - Legal contracts require minimum two parties",
                "parties", "Add all parties involved in the contract", "I want to add additional parties to the contract to meet the minimum requirement.");
        }

        var roles = parties.Select(p => p.Role?.ToLower()).ToList();
        if (roles.Distinct().Count() != roles.Count)
        {
            result.AddInsight(InsightSeverity.Critical,
                "Parties cannot have duplicate roles - Each party should have a unique role",
                "parties", "Ensure each party has a unique role", "I want to update the party roles to ensure each party has a unique role in the contract.");
        }

        for (int i = 0; i < parties.Count; i++)
        {
            var party = parties[i];
            var partyPrefix = $"Parties[{i}]";

            // Critical party validations
            if (string.IsNullOrWhiteSpace(party.Name))
            {
                result.AddInsight(InsightSeverity.Critical,
                    "Party name is required - All parties must be clearly identified",
                    $"parties[{i}].name", "Provide the full legal name of the party", $"I want to add the full legal name for party at position {i + 1}.");
            }

            if (string.IsNullOrWhiteSpace(party.Role))
            {
                result.AddInsight(InsightSeverity.Critical,
                    "Party role is required - Each party's role must be defined",
                    $"parties[{i}].role", "Specify the party's role (e.g., client, provider, vendor)", $"I want to specify the role for party '{party.Name}' at position {i + 1}.");
            }

            // Warning validations for representatives
            if (!party.Representatives.Any())
            {
                result.AddInsight(InsightSeverity.Warning,
                    $"Party '{party.Name}' has no designated representative - Representative clarifies who can act for the party",
                    $"parties[{i}].representatives", "Designate at least one authorized representative", $"I want to add an authorized representative for party '{party.Name}'.");
            }
            else
            {
                for (int repIndex = 0; repIndex < party.Representatives.Count; repIndex++)
                {
                    var rep = party.Representatives[repIndex];

                    if (string.IsNullOrWhiteSpace(rep.Name))
                    {
                        result.AddInsight(InsightSeverity.Warning,
                            $"Representative for '{party.Name}' has no name - Representative name is required",
                            $"parties[{i}].representatives[{repIndex}].name", "Provide the representative's full name", $"I want to add the full name for the representative of party '{party.Name}'.");
                    }

                    if (string.IsNullOrWhiteSpace(rep.Email))
                    {
                        result.AddInsight(InsightSeverity.Warning,
                            $"Representative '{rep.Name}' for party '{party.Name}' has no email contact - Email contact facilitates communication",
                            $"parties[{i}].representatives[{repIndex}].email", "Add a valid email address", $"I want to add an email address for representative '{rep.Name}' of party '{party.Name}'.");
                    }
                    else if (!_emailRegex.IsMatch(rep.Email))
                    {
                        result.AddInsight(InsightSeverity.Warning,
                            $"Representative '{rep.Name}' has invalid email format - Invalid email may cause communication issues",
                            $"parties[{i}].representatives[{repIndex}].email", "Provide a valid email address", $"I want to correct the email format for representative '{rep.Name}' of party '{party.Name}'.");
                    }

                    // Suggestions for representatives
                    if (string.IsNullOrWhiteSpace(rep.Phone))
                    {
                        result.AddInsight(InsightSeverity.Suggestion,
                            $"Consider adding phone contact for representative '{rep.Name}' - Phone contact provides alternative communication",
                            $"parties[{i}].representatives[{repIndex}].phone", "Add a phone number for direct contact", $"I want to add a phone number for representative '{rep.Name}' of party '{party.Name}'.");
                    }

                    if (string.IsNullOrWhiteSpace(rep.Title))
                    {
                        result.AddInsight(InsightSeverity.Suggestion,
                            $"Consider adding title for representative '{rep.Name}' - Title clarifies authority level",
                            $"parties[{i}].representatives[{repIndex}].title", "Add the representative's title", $"I want to add a title for representative '{rep.Name}' of party '{party.Name}'.");
                    }
                }
            }

        }

        return result;
    }

}

// Terms validation
public class TermsValidator : IContractSectionValidator
{
    public ValidationResult Validate(Contract contract)
    {
        var result = new ValidationResult();
        var terms = contract.Terms;

        // Critical validations
        if (terms.Count == 0)
        {
            result.AddInsight(InsightSeverity.Critical,
                "Contract must have terms and conditions - Terms define the contract obligations",
                "terms", "Add contract terms and conditions", "I want to add terms and conditions to the contract.");
            return result;
        }

        // Check for empty terms
        for (int i = 0; i < terms.Count; i++)
        {
            var term = terms[i];
            if (string.IsNullOrWhiteSpace(term.Text))
            {
                result.AddInsight(InsightSeverity.Critical,
                    $"Term at position {i + 1} has no text content - All terms must have meaningful content",
                    $"terms[{i}].text", "Provide text content for the term", $"I want to add text content for the term at position {i + 1}.");
            }
        }

        // Validate term categories
        ValidateTermCategories(result, terms);

        // Validate individual terms
        for (int i = 0; i < terms.Count; i++)
        {
            ValidateIndividualTerm(result, terms[i], i);
        }

        return result;
    }

    private void ValidateTermCategories(ValidationResult result, List<Term> terms)
    {
        var categoryCounts = terms.GroupBy(t => t.Category).ToDictionary(g => g.Key, g => g.Count());

        // Check for financial terms
        if (!categoryCounts.ContainsKey(TermCategory.Financial))
        {
            result.AddInsight(InsightSeverity.Warning,
                "No financial terms specified - Financial terms clarify monetary obligations",
                "terms", "Add financial terms such as payment amounts, schedules, and currency", "I want to add financial terms including payment amounts, schedules, and currency details.");
        }

        // Check for legal terms
        if (!categoryCounts.ContainsKey(TermCategory.Legal))
        {
            result.AddInsight(InsightSeverity.Warning,
                "No legal terms specified - Legal terms provide important protections",
                "terms", "Add legal terms such as governing law, jurisdiction, dispute resolution", "I want to add legal terms including governing law, jurisdiction, and dispute resolution provisions.");
        }

        // Check for obligation terms
        if (!categoryCounts.ContainsKey(TermCategory.Obligation))
        {
            result.AddInsight(InsightSeverity.Suggestion,
                "Consider adding obligation terms - Obligation terms clarify responsibilities of each party",
                "terms", "Add terms defining obligations and responsibilities", "I want to add obligation terms that define the responsibilities of each party.");
        }
    }

    private void ValidateIndividualTerm(ValidationResult result, Term term, int index)
    {
        // Check text content quality
        if (!string.IsNullOrWhiteSpace(term.Text))
        {
            if (term.Text.Length < 10)
            {
                result.AddInsight(InsightSeverity.Warning,
                    $"Term at position {index + 1} is very short - Terms should be descriptive and clear",
                    $"terms[{index}].text", "Expand the term with more detailed content", $"I want to expand the term at position {index + 1} with more detailed and descriptive content.");
            }

            // Check for common contract term patterns
            var text = term.Text.ToLower();
            if (term.Category == TermCategory.Financial && !ContainsFinancialKeywords(text))
            {
                result.AddInsight(InsightSeverity.Suggestion,
                    $"Financial term at position {index + 1} may lack clarity - Financial terms should clearly specify amounts, dates, and conditions",
                    $"terms[{index}].text", "Include specific amounts, payment schedules, or financial conditions", $"I want to improve the financial term at position {index + 1} by adding specific amounts, payment schedules, or financial conditions.");
            }

            if (term.Category == TermCategory.Legal && !ContainsLegalKeywords(text))
            {
                result.AddInsight(InsightSeverity.Suggestion,
                    $"Legal term at position {index + 1} may lack clarity - Legal terms should specify jurisdiction, governing law, or legal procedures",
                    $"terms[{index}].text", "Include specific legal provisions, jurisdiction, or governing law references", $"I want to improve the legal term at position {index + 1} by adding specific legal provisions, jurisdiction, or governing law references.");
            }
        }
    }

    private bool ContainsFinancialKeywords(string text)
    {
        var keywords = new[] { "amount", "payment", "currency", "dollar", "euro", "cost", "price", "fee", "invoice", "billing" };
        return keywords.Any(keyword => text.Contains(keyword));
    }

    private bool ContainsLegalKeywords(string text)
    {
        var keywords = new[] { "law", "jurisdiction", "court", "dispute", "arbitration", "governing", "legal", "liability", "damages" };
        return keywords.Any(keyword => text.Contains(keyword));
    }
}

// Signatures validation
public class SignaturesValidator : IContractSectionValidator
{
    public ValidationResult Validate(Contract contract)
    {
        var result = new ValidationResult();
        var signatures = contract.Parties.SelectMany(p => p.Signatories).ToList();
        var parties = contract.Parties;

        // Critical validations
        if (signatures.Count == 0)
        {
            result.AddInsight(InsightSeverity.Critical,
                "Contract has no signatures - Signatures are required for contract validity",
                "signatures", "Obtain signatures from all parties", "I want to add signatures from all parties to make the contract valid.");
            return result;
        }

        var partyNames = parties.Select(p => p.Name?.ToLower()).ToHashSet();
        var signatoryNames = signatures.Select(s => s.Name?.ToLower()).ToHashSet();

        // Check if all parties have signatories
        for (int i = 0; i < parties.Count; i++)
        {
            var party = parties[i];
            if (!party.Signatories.Any())
            {
                result.AddInsight(InsightSeverity.Critical,
                    $"Party '{party.Name}' has no designated signatories - All parties must have authorized signatories",
                    $"parties[{i}].signatories", $"Add authorized signatories for party '{party.Name}'", $"I want to add authorized signatories for party '{party.Name}'.");
            }
        }

        // Validate individual signatures
        for (int i = 0; i < signatures.Count; i++)
        {
            ValidateIndividualSignature(result, signatures[i], i, parties);
        }

        return result;
    }

    private void ValidateIndividualSignature(ValidationResult result, Person signatory, int index, List<Party> parties)
    {
        // Critical validations
        if (string.IsNullOrWhiteSpace(signatory.Name))
        {
            result.AddInsight(InsightSeverity.Critical,
                "Signatory is missing name - Signatory name is required for signature validity",
                $"signatories[{index}].name", "Provide the name of the authorized signatory", $"I want to add the name for the signatory at position {index + 1}.");
        }

        // Warning validations
        if (string.IsNullOrWhiteSpace(signatory.Title))
        {
            result.AddInsight(InsightSeverity.Warning,
                $"Signatory '{signatory.Name}' has no title specified - Title helps establish signatory authority",
                $"signatories[{index}].title", "Provide the signatory's title or position", $"I want to add a title or position for signatory '{signatory.Name}'.");
        }

    }
}

// Main contract validator
public class ContractValidator
{
    private readonly List<IContractSectionValidator> _validators;

    public ContractValidator()
    {
        _validators = new List<IContractSectionValidator>
        {
            new ScopeValidator(),
            new PartiesValidator(),
            new TermsValidator(),
            new SignaturesValidator()
        };
    }

    public ValidationResult ValidateContract(Contract contract)
    {
        var result = new ValidationResult();

        if (contract == null)
        {
            result.AddInsight(InsightSeverity.Critical,
                "Contract object is null - Cannot validate a null contract",
                null, "Provide a valid contract object", "I want to create a new contract object.");
            return result;
        }

        // Run all section validators
        foreach (var validator in _validators)
        {
            var sectionResult = validator.Validate(contract);
            result.Insights.AddRange(sectionResult.Insights);
        }

        return result;
    }

    public ValidationResult ValidateContract(Contract contract, params Type[] validatorTypes)
    {
        var result = new ValidationResult();

        if (contract == null)
        {
            result.AddInsight(InsightSeverity.Critical,
                "Contract object is null - Cannot validate a null contract",
                null, "Provide a valid contract object", "I want to create a new contract object.");
            return result;
        }

        // Run only specified validators
        foreach (var validatorType in validatorTypes)
        {
            if (typeof(IContractSectionValidator).IsAssignableFrom(validatorType))
            {
                var validator = (IContractSectionValidator?)Activator.CreateInstance(validatorType);
                if (validator != null)
                {
                    var sectionResult = validator.Validate(contract);
                    result.Insights.AddRange(sectionResult.Insights);
                }
            }
        }

        return result;
    }

    public ValidationResult GetInsightsBySection(Contract contract, string sectionPath)
    {
        var fullResult = ValidateContract(contract);
        var filteredResult = new ValidationResult();
        filteredResult.Insights.AddRange(fullResult.Insights.Where(i => 
            i.FieldPath != null && i.FieldPath.StartsWith(sectionPath, StringComparison.OrdinalIgnoreCase)));
        return filteredResult;
    }

    public ValidationResult GetInsightsBySeverity(Contract contract, InsightSeverity severity)
    {
        var fullResult = ValidateContract(contract);
        var filteredResult = new ValidationResult();
        filteredResult.Insights.AddRange(fullResult.Insights.Where(i => i.Severity == severity));
        return filteredResult;
    }
}




