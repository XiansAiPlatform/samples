using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PowerOfAttorneyAgent.Model;

/// <summary>
/// Represents a constraint or limitation on the power of attorney
/// </summary>
public class Condition
{
    [Required]
    [MinLength(1)]
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [Required]
    [MinLength(1)]
    [JsonPropertyName("type")]
    public ConditionType Type { get; set; }

    [Required]
    [MinLength(1)]
    [JsonPropertyName("text")]
    public required string Text { get; set; }

    [Required]
    [MinLength(1)]
    [JsonPropertyName("targetId")]
    public Guid? TargetId { get; set; }

}

