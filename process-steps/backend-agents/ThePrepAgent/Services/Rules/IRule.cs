using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;

namespace PowerOfAttorneyAgent.Validations;

/// <summary>
/// Interface for business rules that validate and enforce compliance on PowerOfAttorneyDocument
/// </summary>
public interface IRule
{   
    /// <summary>
    /// Description of what the rule checks
    /// </summary>
    string Description { get; }
    
    /// <summary>
    /// Applies the rule to the document, throwing exceptions for non-compliance
    /// and adding validation messages for warnings/recommendations
    /// </summary>
    /// <param name="document">The document to validate</param>
    /// <param name="result">ServiceResult to add validation messages to</param>
    /// <exception cref="InvalidOperationException">Thrown when the rule is violated</exception>
    void Apply(PowerOfAttorney document, AuditResult<PowerOfAttorney> result);
} 