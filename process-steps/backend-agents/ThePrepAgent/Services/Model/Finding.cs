using System.Text.Json.Serialization;

namespace PowerOfAttorneyAgent.Services;

/// <summary>
/// Represents the type of validation message
/// </summary>
public enum FindingType
{
    Error,
    Warning,
    Recommendation,
    Information
}

public class CorrectiveAction {
    [JsonPropertyName("title")]
    public required string Title { get; set; } = string.Empty;

    [JsonPropertyName("prompt")]
    public required string Prompt { get; set; } = string.Empty;

    [JsonPropertyName("scope")]
    [JsonConverter(typeof(JsonStringEnumConverter<Scope>))]
    public required Scope Scope { get; set; }

    public CorrectiveAction() { }
}

public enum Scope {
    [JsonStringEnumMemberName("representative_bot")]
    RepresentativeBot,
    [JsonStringEnumMemberName("witness_bot")]
    WitnessBot,
    [JsonStringEnumMemberName("condition_bot")]
    ConditionBot
}

/// <summary>
/// Represents a validation message with type and details
/// </summary>
public class Finding
{
    /// <summary>
    /// The type of validation message
    /// </summary>
    [JsonPropertyName("type")]
    [JsonConverter(typeof(JsonStringEnumConverter<FindingType>))]
    public FindingType Type { get; set; } = FindingType.Information;
    
    /// <summary>
    /// The validation message
    /// </summary>
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// The field or property name related to this validation (optional)
    /// </summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    
    /// <summary>
    /// Additional context or details (optional)
    /// </summary>
    [JsonPropertyName("link")]
    public string? Link { get; set; }


    /// <summary>
    /// The action to take to fix the finding (optional)
    /// </summary>
    [JsonPropertyName("actions")]
    public List<CorrectiveAction> Actions { get; set; } = new List<CorrectiveAction>();

    public Finding() { }

    public Finding(FindingType type, string? message = null, string? description = null, string? link = null, List<CorrectiveAction>? actions = null)
    {
        Type = type;
        Message = message ?? string.Empty;
        Description = description;
        Link = link;
        Actions = actions ?? new List<CorrectiveAction>();
    }
}