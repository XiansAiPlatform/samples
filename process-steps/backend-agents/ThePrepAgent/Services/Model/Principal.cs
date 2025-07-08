using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PowerOfAttorneyAgent.Model;

/// <summary>
/// Represents the person granting the power of attorney
/// </summary>
public class Principal
{
    [JsonPropertyName("userId")]
    public Guid UserId { get; set; }

    [Required]
    [MinLength(1)]
    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    [JsonPropertyName("nationalId")]
    public string NationalId { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;
} 