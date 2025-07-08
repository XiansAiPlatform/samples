using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PowerOfAttorneyAgent.Model;

/// <summary>
/// Represents a witness to the power of attorney signing
/// </summary>
public class Witness
{
    [JsonPropertyName("id")]
    public required Guid WitnessId { get; set; }

    [Required]
    [MinLength(1)]
    [JsonPropertyName("fullName")]
    public required string FullName { get; set; }

    [Required]
    [MinLength(1)]
    [JsonPropertyName("nationalIdNumber")]
    public required string NationalIdNumber { get; set; }

} 