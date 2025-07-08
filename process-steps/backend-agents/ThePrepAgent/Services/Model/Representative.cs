using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PowerOfAttorneyAgent.Model;

/// <summary>
/// Represents an authorized representative in the power of attorney
/// </summary>
public class Representative
{
    [JsonPropertyName("id")]
    public required Guid Id { get; set; }

    [Required]
    [MinLength(1)]
    [JsonPropertyName("fullName")]
    public required string FullName { get; set; }

    [Required]
    [MinLength(1)]
    [JsonPropertyName("nationalId")]
    public string? NationalId { get; set; }

    [Required]
    [MinLength(1)]
    [JsonPropertyName("address")]
    public required string Address { get; set; }

    [JsonPropertyName("relationship")]
    public string? Relationship { get; set; }

    /// <summary>
    /// Returns a JSON string representation of the Representative
    /// </summary>
    /// <returns>JSON formatted string</returns>
    public override string ToString()
    {
        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        
        return JsonSerializer.Serialize(this, options);
    }
} 