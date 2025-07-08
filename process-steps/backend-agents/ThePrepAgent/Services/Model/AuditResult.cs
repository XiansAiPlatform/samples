using System.Text.Json.Serialization;

namespace PowerOfAttorneyAgent.Services;


/// <summary>
/// Generic service result class that wraps return data with validation messages
/// </summary>
/// <typeparam name="T">The type of data being returned</typeparam>
public class AuditResult<T>
{
    /// <summary>
    /// The data being subject to the audit
    /// </summary>
    [JsonPropertyName("document")]
    public T? Document { get; set; }
    
    /// <summary>
    /// List of validation messages
    /// </summary>
    [JsonPropertyName("findings")]
    public List<Finding> Findings { get; set; } = new List<Finding>();
    
    /// <summary>
    /// Indicates if there are any error validations
    /// </summary>
    public bool HasErrors => Findings.Any(v => v.Type == FindingType.Error);
        public AuditResult() { }

    public AuditResult(List<Finding> validations)
    {
        Findings = validations ?? new List<Finding>();
    }

    public void AddFinding(Finding finding)
    {
        Findings.Add(finding);
    }

    // /// <summary>
    // /// Adds an error validation
    // /// </summary>
    // public void AddError(string message, string? description = null, string? link = null, Scope? scope = null)
    // {
    //     Findings.Add(new Finding(FindingType.Error, scope, message, description, link));
    // }

    // /// <summary>
    // /// Adds a warning validation
    // /// </summary>
    // public void AddWarning(string message, string? description = null, string? link = null)
    // {
    //     Findings.Add(new Finding(FindingType.Warning, message, description, link));
    // }

    // /// <summary>
    // /// Adds a recommendation validation
    // /// </summary>
    // public void AddRecommendation(string message, string? description = null, string? link = null)
    // {
    //     Findings.Add(new Finding(FindingType.Recommendation, message, description, link));
    // }

    // /// <summary>
    // /// Adds an information validation
    // /// </summary>
    // public void AddInformation(string message, string? description = null, string? link = null)
    // {
    //     Findings.Add(new Finding(FindingType.Information, message, description, link));
    // }

}
