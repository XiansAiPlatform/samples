using System.ComponentModel.DataAnnotations;

namespace PowerOfAttorneyAgent.Model;

/// <summary>
/// Represents an asset owned by the user
/// </summary>
public class Asset
{
    public Guid Id { get; set; }

    [Required]
    [MinLength(1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public string Type { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public decimal Value { get; set; }

    public string? Location { get; set; }

    public DateTime AcquisitionDate { get; set; }

    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
} 