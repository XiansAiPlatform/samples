using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PowerOfAttorneyAgent.Model;

/// <summary>
/// Represents the core Power of Attorney information
/// </summary>
public class PowerOfAttorney
{
    [Required]
    [JsonPropertyName("principal")]
    public Principal Principal { get; set; } = new Principal();

    [Required]
    [MinLength(1)]
    [JsonPropertyName("scope")]
    public string Scope { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    [MaxLength(3)]
    [JsonPropertyName("representatives")]
    public List<Representative> Representatives { get; set; } = new List<Representative>();

    [Required]
    [JsonPropertyName("conditions")]
    public List<Condition> Conditions { get; set; } = new List<Condition>();

    [Required]
    [MaxLength(2)]
    [JsonPropertyName("witnesses")]
    public List<Witness> Witnesses { get; set; } = new List<Witness>();

    public PowerOfAttorney Clone()
    {
        // Simple deep clone using JSON serialization
        var json = JsonSerializer.Serialize(this);
        return JsonSerializer.Deserialize<PowerOfAttorney>(json) ?? new PowerOfAttorney();
    }
} 