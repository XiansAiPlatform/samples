using System.Text.Json;
using Services;

namespace Repositories;

/// <summary>
/// Model to wrap user acquaintances for file storage
/// </summary>
public class UserAcquaintances
{
    public string UserId { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime LastModified { get; set; } = DateTime.UtcNow;
    public List<Person> Acquaintances { get; set; } = new();
}

/// <summary>
/// Repository for managing person/acquaintance data with hardcoded sample data
/// </summary>
public class PersonRepository
{
    private readonly string _tempDirectory;
    private readonly JsonSerializerOptions _jsonOptions;

    public PersonRepository()
    {
        // Keep temp directory setup for compatibility, though not used with hardcoded data
        _tempDirectory = Path.Combine(Path.GetTempPath(), "PersonAcquaintances");
        Directory.CreateDirectory(_tempDirectory);
        
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true,
            PropertyNameCaseInsensitive = true
        };
    }

    /// <summary>
    /// Gets the file path for a user's acquaintances
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>Full file path for the user's acquaintances file</returns>
    private string GetUserFilePath(string userId)
    {
        return Path.Combine(_tempDirectory, $"{userId}-acquaintances.json");
    }

    /// <summary>
    /// Returns hardcoded sample acquaintances instead of loading from file
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>UserAcquaintances instance with 5 sample acquaintances</returns>
    private async Task<UserAcquaintances> LoadUserAcquaintancesAsync(string userId)
    {
        await Task.CompletedTask; // Maintain async signature
        
        return new UserAcquaintances 
        { 
            UserId = userId,
            CreatedDate = DateTime.UtcNow.AddDays(-30),
            LastModified = DateTime.UtcNow.AddDays(-5),
            Acquaintances = new List<Person>
            {
                new Person
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    Name = "Sarah Johnson",
                    NationalId = "123456789",
                    Title = "Senior Software Engineer",
                    Email = "sarah.johnson@techcorp.com",
                    Phone = "+1-555-0101"
                },
                new Person
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    Name = "Michael Chen",
                    NationalId = "987654321",
                    Title = "Legal Counsel",
                    Email = "m.chen@lawfirm.com",
                    Phone = "+1-555-0202"
                },
                new Person
                {
                    Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "Dr. Emma Rodriguez",
                    NationalId = "456789123",
                    Title = "Chief Medical Officer",
                    Email = "e.rodriguez@healthsys.org",
                    Phone = "+1-555-0303"
                },
                new Person
                {
                    Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    Name = "James Patterson",
                    NationalId = "789123456",
                    Title = "Business Development Manager",
                    Email = "j.patterson@business.co",
                    Phone = "+1-555-0404"
                },
                new Person
                {
                    Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    Name = "Lisa Thompson",
                    NationalId = "321654987",
                    Title = "Financial Advisor",
                    Email = "lisa.thompson@finance.net",
                    Phone = "+1-555-0505"
                }
            }
        };
    }

    /// <summary>
    /// No-op save method since we're using hardcoded data instead of file handling
    /// </summary>
    /// <param name="userAcquaintances">The user acquaintances to save</param>
    /// <returns>Always returns true since no actual saving is performed</returns>
    private async Task<bool> SaveUserAcquaintancesAsync(UserAcquaintances userAcquaintances)
    {
        await Task.CompletedTask; // Maintain async signature
        Console.WriteLine($"Simulated save for user {userAcquaintances.UserId} (using hardcoded data, no actual file save)");
        return true;
    }

    /// <summary>
    /// Gets all acquaintances for a specific user
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>List of acquaintances for the user</returns>
    public async Task<List<Person>> GetAcquaintancesAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
        }

        var userAcquaintances = await LoadUserAcquaintancesAsync(userId);
        return userAcquaintances.Acquaintances.OrderBy(p => p.Name).ToList();
    }

    /// <summary>
    /// Creates a new acquaintance for a user
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="person">The person to add as an acquaintance</param>
    /// <returns>The created person with generated ID if it was empty</returns>
    public async Task<Person> CreateAcquaintanceAsync(string userId, Person person)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
        }

        if (person == null)
        {
            throw new ArgumentNullException(nameof(person));
        }

        if (string.IsNullOrWhiteSpace(person.Name))
        {
            throw new ArgumentException("Person name is required", nameof(person));
        }

        // Generate ID if not provided
        if (person.Id == Guid.Empty)
        {
            person.Id = Guid.NewGuid();
        }

        var userAcquaintances = await LoadUserAcquaintancesAsync(userId);
        
        // Check if person with same ID already exists
        if (userAcquaintances.Acquaintances.Any(p => p.Id == person.Id))
        {
            throw new InvalidOperationException($"Acquaintance with ID {person.Id} already exists for user {userId}");
        }

        // Check if person with same name already exists (optional check)
        var existingPerson = userAcquaintances.Acquaintances.FirstOrDefault(p => 
            p.Name.Equals(person.Name, StringComparison.OrdinalIgnoreCase));
        
        if (existingPerson != null)
        {
            Console.WriteLine($"Warning: Person with name '{person.Name}' already exists for user {userId}");
        }

        userAcquaintances.Acquaintances.Add(person);
        await SaveUserAcquaintancesAsync(userAcquaintances);

        Console.WriteLine($"Created acquaintance {person.Name} (ID: {person.Id}) for user {userId}");
        return person;
    }

    /// <summary>
    /// Gets a specific acquaintance by their GUID from hardcoded sample data
    /// </summary>
    /// <param name="personId">The GUID of the person</param>
    /// <returns>The person if found, null otherwise</returns>
    public async Task<Person?> GetAcquaintanceAsync(Guid personId)
    {
        if (personId == Guid.Empty)
        {
            throw new ArgumentException("Person ID cannot be empty", nameof(personId));
        }

        // Search through hardcoded sample data (same for all users)
        var sampleData = await LoadUserAcquaintancesAsync("sample-user");
        var person = sampleData.Acquaintances.FirstOrDefault(p => p.Id == personId);
        return person;
    }

    /// <summary>
    /// Updates an existing acquaintance
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="person">The updated person information</param>
    /// <returns>True if successful, false if person not found</returns>
    public async Task<bool> UpdateAcquaintanceAsync(string userId, Person person)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
        }

        if (person.Id == Guid.Empty)
        {
            throw new ArgumentException("Person ID cannot be empty", nameof(person));
        }

        var userAcquaintances = await LoadUserAcquaintancesAsync(userId);
        var existingPersonIndex = userAcquaintances.Acquaintances.FindIndex(p => p.Id == person?.Id);
        
        if (existingPersonIndex == -1)
        {
            return false;
        }

        userAcquaintances.Acquaintances[existingPersonIndex] = person;
        await SaveUserAcquaintancesAsync(userAcquaintances);

        Console.WriteLine($"Updated acquaintance {person.Name} (ID: {person.Id}) for user {userId}");
        return true;
    }

    /// <summary>
    /// Deletes an acquaintance from a user's list
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="personId">The GUID of the person to delete</param>
    /// <returns>True if successful, false if person not found</returns>
    public async Task<bool> DeleteAcquaintanceAsync(string userId, Guid personId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
        }

        if (personId == Guid.Empty)
        {
            throw new ArgumentException("Person ID cannot be empty", nameof(personId));
        }

        var userAcquaintances = await LoadUserAcquaintancesAsync(userId);
        var personToRemove = userAcquaintances.Acquaintances.FirstOrDefault(p => p.Id == personId);
        
        if (personToRemove == null)
        {
            return false;
        }

        userAcquaintances.Acquaintances.Remove(personToRemove);
        await SaveUserAcquaintancesAsync(userAcquaintances);

        Console.WriteLine($"Deleted acquaintance {personToRemove.Name} (ID: {personId}) for user {userId}");
        return true;
    }

    /// <summary>
    /// Gets all users who have acquaintances stored (returns sample user for hardcoded data)
    /// </summary>
    /// <returns>List of user IDs</returns>
    public List<string> GetAllUserIds()
    {
        // Since we're using hardcoded data, return a sample user ID
        return new List<string> { "sample-user", "demo-user", "test-user" };
    }

    /// <summary>
    /// Simulates clearing all acquaintances for a specific user (no-op for hardcoded data)
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>Always returns true since using hardcoded data</returns>
    public async Task<bool> ClearUserAcquaintancesAsync(string userId)
    {
        await Task.CompletedTask;
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
        }

        Console.WriteLine($"Simulated clear all acquaintances for user {userId} (using hardcoded data, no actual clearing)");
        return true;
    }

    /// <summary>
    /// Simulates clearing all acquaintances for all users (no-op for hardcoded data)
    /// </summary>
    /// <returns>Always returns true since using hardcoded data</returns>
    public bool ClearAllAcquaintances()
    {
        Console.WriteLine("Simulated clear all acquaintances for all users (using hardcoded data, no actual clearing)");
        return true;
    }
}