
namespace Services;

// Model classes for Contract structure
public class Contract
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? EffectiveDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<Party> Parties { get; set; } = new();
    public List<Term> Terms { get; set; } = new();
}

public class Party
{
    public Guid Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<Person> Representatives { get; set; } = new();
    public List<Person> Signatories { get; set; } = new();
}

public class Person
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string NationalId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}


public class Term
{
    public Guid Id { get; set; }
    public TermCategory Category { get; set; } = TermCategory.General;
    public required string Text { get; set; }
}

public enum TermCategory {
    Financial,
    Obligation,
    Liability,
    Duration,
    Termination,
    Confidentiality,
    NonCompete,
    NonSolicitation,
    NonDisclosure,
    NonAssignment,
    NonTransfer,
    Legal,
    Renewal,
    General,
    Other
}
