using Microsoft.Extensions.Logging;
using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;

namespace PowerOfAttorneyAgent.Validations;

/// <summary>
/// Rule engine that orchestrates and applies all business rules to PowerOfAttorneyDocument instances
/// </summary>
public class RuleEngine
{
    private readonly List<IRule> _rules;
    private readonly ILogger<RuleEngine> _logger;

    public RuleEngine()
    {
        _logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger<RuleEngine>();
        _rules = new List<IRule>
        {
            new ValidInputRule(),
            new MaximumRepresentativesRule(),
            new WitnessesCountRule(),
            new ConflictOfInterestRule()
        };
    }

    /// <summary>
    /// Constructor that allows custom rule configuration
    /// </summary>
    /// <param name="rules">Custom set of rules to use</param>
    public RuleEngine(IEnumerable<IRule> rules)
    {
        _logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger<RuleEngine>();
        _rules = rules.ToList();
    }

    /// <summary>
    /// Applies all rules to the document. Throws exceptions for critical violations,
    /// adds warnings/recommendations to the result
    /// </summary>
    /// <param name="document">The document to validate</param>
    /// <returns>ServiceResult with validation messages</returns>
    /// <exception cref="InvalidOperationException">Thrown when critical rules are violated</exception>
    public AuditResult<PowerOfAttorney> ApplyAllRules(PowerOfAttorney document)
    {
        var result = new AuditResult<PowerOfAttorney>();

        if (document == null)
        {
            throw new InvalidOperationException("Document cannot be null");
        }

        result.Document = document;

        var appliedRules = new List<string>();
        var failedRules = new List<string>();

        foreach (var rule in _rules)
        {
            try
            {
                rule.Apply(document, result);
                appliedRules.Add(rule.GetType().Name);
            }
            catch (InvalidOperationException ex)
            {
                failedRules.Add(rule.GetType().Name);
                // Re-throw with rule context
                throw new InvalidOperationException($"Rule application failed: {ex.Message}", ex);
            }
        }

        // Add summary information
        _logger.LogInformation($"Applied {appliedRules.Count} rules successfully: {string.Join(", ", appliedRules)}", "RuleEngine");
        
        if (failedRules.Any())
        {
            result.AddFinding(
                new Finding(
                    FindingType.Error, 
                    $"Failed rules: {string.Join(", ", failedRules)}", 
                    "RuleEngine"));
        }

        return result;
    }

    /// <summary>
    /// Applies a specific rule by name
    /// </summary>
    /// <param name="document">The document to validate</param>
    /// <param name="ruleTitle">The title of the rule to apply</param>
    /// <returns>ServiceResult with validation messages</returns>
    /// <exception cref="ArgumentException">Thrown when rule is not found</exception>
    /// <exception cref="InvalidOperationException">Thrown when the rule is violated</exception>
    public AuditResult<PowerOfAttorney> ApplyRule(PowerOfAttorney document, Type ruleType)
    {
        var rule = _rules.FirstOrDefault(r => r.GetType() == ruleType);
        
        if (rule == null)
        {
            throw new ArgumentException($"Rule '{ruleType.Name}' not found. Available rules: {string.Join(", ", _rules.Select(r => r.GetType().Name))}");
        }

        var result = new AuditResult<PowerOfAttorney>();
        rule.Apply(document, result);
        
        result.AddFinding(
            new Finding(
                FindingType.Information, 
                $"Applied rule: {rule.GetType().Name}"));
        return result;
    }

    /// <summary>
    /// Gets information about all available rules
    /// </summary>
    /// <returns>List of rule information</returns>
    public List<IRule> GetAvailableRules()
    {
        return _rules.ToList();
    }

    /// <summary>
    /// Adds a rule to the engine
    /// </summary>
    /// <param name="rule">The rule to add</param>
    public void AddRule(IRule rule)
    {
        if (!_rules.Any(r => r.GetType() == rule.GetType()))
        {
            _rules.Add(rule);
        }
    }

    /// <summary>
    /// Removes a rule from the engine
    /// </summary>
    /// <param name="ruleTitle">The title of the rule to remove</param>
    /// <returns>True if removed, false if not found</returns>
    public bool RemoveRule(Type ruleType)
    {
        var rule = _rules.FirstOrDefault(r => r.GetType() == ruleType);
        if (rule != null)
        {
            _rules.Remove(rule);
            return true;
        }
        return false;
    }
}
