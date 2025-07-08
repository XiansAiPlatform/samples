using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;

namespace PowerOfAttorneyAgent.Validations;

/// <summary>
/// Abstract base class for business rules providing common functionality
/// </summary>
public abstract class BaseRule : IRule
{
    /// <summary>
    /// Link to the rule
    /// </summary>
    public abstract string Link { get; }

    /// <summary>
    /// Description of what the rule checks
    /// </summary>
    public abstract string Description { get; }

    /// <summary>
    /// Applies the rule to the document, throwing exceptions for non-compliance
    /// and adding validation messages for warnings/recommendations
    /// </summary>
    /// <param name="document">The document to validate</param>
    /// <param name="result">ServiceResult to add validation messages to</param>
    /// <exception cref="InvalidOperationException">Thrown when the rule is violated</exception>
    public virtual void Apply(PowerOfAttorney document, AuditResult<PowerOfAttorney> result)
    {
        if (document == null)
        {
            throw new InvalidOperationException("Document or PowerOfAttorney cannot be null");
        }

        ApplyRule(document, result);
    }

    /// <summary>
    /// Implement this method to define the specific rule logic
    /// </summary>
    /// <param name="document">The document to validate</param>
    /// <param name="result">ServiceResult to add validation messages to</param>
    protected abstract void ApplyRule(PowerOfAttorney document, AuditResult<PowerOfAttorney> result);

    /// <summary>
    /// Helper method to throw compliance exception
    /// </summary>
    /// <param name="message">The error message</param>
    /// <exception cref="InvalidOperationException">Always thrown</exception>
    protected void ThrowComplianceViolation(string message)
    {
        throw new InvalidOperationException($"[{Description}] {message}");
    }

    /// <summary>
    /// Helper method to validate string fields
    /// </summary>
    protected bool IsValidString(string? value, bool required = true)
    {
        return required ? !string.IsNullOrWhiteSpace(value) : true;
    }

    /// <summary>
    /// Helper method to validate collection counts
    /// </summary>
    protected bool IsValidCollectionCount<T>(ICollection<T>? collection, int? minCount = null, int? maxCount = null)
    {
        var count = collection?.Count ?? 0;
        
        if (minCount.HasValue && count < minCount.Value) return false;
        if (maxCount.HasValue && count > maxCount.Value) return false;
        
        return true;
    }

    /// <summary>
    /// Helper method to check for duplicates in a collection
    /// </summary>
    protected bool HasDuplicates<T, TKey>(ICollection<T>? collection, Func<T, TKey> keySelector)
    {
        if (collection == null || collection.Count <= 1) return false;
        
        return collection
            .GroupBy(keySelector)
            .Any(g => g.Count() > 1);
    }

    /// <summary>
    /// Helper method to get duplicate values from a collection
    /// </summary>
    protected List<TKey> GetDuplicates<T, TKey>(ICollection<T>? collection, Func<T, TKey> keySelector)
    {
        if (collection == null || collection.Count <= 1) return new List<TKey>();
        
        return collection
            .GroupBy(keySelector)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();
    }
} 