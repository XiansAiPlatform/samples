# Contract Validation System

This validation system provides comprehensive validation for legal contracts with insights categorized by severity and section.

## Architecture

### Core Components

- **ValidationInsight**: Represents a single validation finding with severity, message, field path, and suggested action
- **ValidationResult**: Contains collection of insights with convenience properties
- **IContractSectionValidator**: Interface for section-specific validators
- **ContractValidator**: Main orchestrator for all validations

### Insight Severities

- **Critical**: Issues that prevent contract validity (missing required fields, invalid structure)
- **Warning**: Issues that should be addressed but don't prevent validity (missing contact info, invalid formats)
- **Suggestion**: Recommendations for improvement (additional clauses, best practices)

### Insight Sections

- **Scope**: Contract title, dates, description, deliverables
- **Parties**: Party information, addresses, contacts, representatives
- **Terms**: Contract terms including financial, legal, and obligation terms
- **Signatures**: Signature validity and completeness
- **General**: Overall contract structure

## Validators

### ScopeValidator

Validates contract scope including:

- ✅ Required fields: title, effective date, description
- ⚠️ Date logic: effective date before expiration, backdating warnings
- 💡 Suggestions: deliverables, renewal terms

### PartiesValidator

Validates contract parties including:

- ✅ Minimum two parties with unique roles
- ✅ Required party names and roles
- ⚠️ Contact information and address validation
- ⚠️ Email format validation
- 💡 Phone contact and representative title suggestions

### TermsValidator

Validates contract terms including:

- ✅ Required terms validation
- ⚠️ Essential financial terms: totalAmount, currency, paymentSchedule
- ⚠️ Essential legal terms: governingLaw, jurisdiction
- ⚠️ Monetary amount validation (positive values)
- 💡 Recommended legal protections: termination, confidentiality, dispute resolution

### SignaturesValidator

Validates signatures including:

- ✅ All parties must sign
- ✅ Required signer name and date
- ⚠️ Future signature dates
- ⚠️ Unauthorized signers
- ⚠️ Unknown parties signing

## Usage Examples

### Basic Validation

```csharp
var validator = new ContractValidator();
var result = validator.ValidateContract(contract);

Console.WriteLine($"Contract Valid: {result.IsValid}");
Console.WriteLine($"Critical Issues: {result.Insights.Count(i => i.Severity == InsightSeverity.Critical)}");
```

### Section-Specific Validation

```csharp
// Validate only fields related to parties
var partiesResult = validator.GetInsightsBySection(contract, "parties");

// Validate only critical issues
var criticalResult = validator.GetInsightsBySeverity(contract, InsightSeverity.Critical);
```

### Partial Validation

```csharp
// Validate only specific sections
var result = validator.ValidateContract(contract, 
    typeof(ScopeValidator), 
    typeof(PartiesValidator));
```

### Custom Validator

```csharp
public class CustomValidator : TermsValidator
{
    public new ValidationResult Validate(Contract contract)
    {
        var result = base.Validate(contract);
        
        // Add custom validations
        result.AddInsight(InsightSeverity.Suggestion, InsightSection.Terms, 
            "CUSTOM_RULE", "Custom validation message", 
            "Additional details", "FieldPath", currentValue, "Suggested action");
        
        return result;
    }
}
```

## Validation Rules

### Critical Rules (Contract Invalid)

- Contract title missing
- Effective date missing
- Contract description missing
- Less than 2 parties
- Duplicate party roles
- Party names missing
- Party roles missing
- Required terms missing values
- No signatures
- Parties not signed

### Warning Rules (Should Address)

- Invalid date ranges
- Backdated contracts
- Missing scope of work
- Missing contact information
- Invalid email formats
- Missing representatives
- Incomplete addresses
- Missing essential financial/legal terms
- Invalid monetary amounts
- Future signature dates
- Unauthorized signers

### Suggestion Rules (Best Practices)

- Missing deliverables
- Missing renewal terms
- Missing phone contacts
- Missing representative titles
- Missing term labels/types/categories
- Missing recommended legal clauses

## Running the Demo

The validation system includes a comprehensive demo that shows various validation scenarios:

```bash
dotnet run
```

This will run the validation demo before starting the main agent, showing examples of:

- Full contract validation
- Section-specific validation
- Severity-based filtering
- Validation summary statistics

## Integration with Legal Contract Bot

The validation system can be integrated into the Legal Contract Bot workflow to:

- Validate contracts before processing
- Provide real-time feedback during contract creation
- Generate compliance reports
- Suggest improvements to contract quality

## Extensibility

The system is designed to be easily extensible:

- Add new validators by implementing `IContractSectionValidator`
- Extend existing validators through inheritance
- Add new insight sections and severities as needed
- Customize validation rules for specific contract types or jurisdictions
