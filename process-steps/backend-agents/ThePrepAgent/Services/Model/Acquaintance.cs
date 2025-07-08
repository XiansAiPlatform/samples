using System.ComponentModel.DataAnnotations;

namespace PowerOfAttorneyAgent.Model;

/// <summary>
/// Represents an acquaintance of the user
/// </summary>
public class Acquaintance
{
    public Guid AcquaintanceId { get; set; }

    [Required]
    [MinLength(1)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public string Relationship { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public string NationalIdNumber { get; set; } = string.Empty;

    public string? ContactNumber { get; set; }

    public string? Email { get; set; }

    public required string Address { get; set; }

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
} 