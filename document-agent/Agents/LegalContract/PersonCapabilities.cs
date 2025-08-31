using Services;
using XiansAi.Flow.Router.Plugins;
using XiansAi.Logging;
using XiansAi.Messaging;
using Agents.Utils;
using Repositories;

namespace Agents.LegalContract;

public class PersonCapabilities
{
    private readonly MessageThread _thread;
    private readonly DocumentContext _documentContext;
    private readonly PersonRepository _personRepository;
    private static readonly Logger<PersonCapabilities> _logger =
        Logger<PersonCapabilities>.For();

    public PersonCapabilities(MessageThread thread)
    {
        _thread = thread;
        _documentContext = new DocumentContext(_thread);
        _personRepository = new PersonRepository();
    }

    [Capability("Get all acquaintances for the current user - Use when user wants to view their list of people/contacts")]
    [Returns("List of all acquaintances (people) associated with the current user")]
    public async Task<List<Person>> GetUserAcquaintances()
    {
        var userId = _documentContext.UserId;

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID cannot be empty. Please ensure you are logged in.");
        }

        await _thread.SendData(new WorkLog($"Starting to retrieve acquaintances for user: {userId}"));

        try
        {
            var acquaintances = await _personRepository.GetAcquaintancesAsync(userId);

            await _thread.SendData(new WorkLog($"Successfully retrieved {acquaintances.Count} acquaintances for user {userId}"));
            return acquaintances;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while retrieving user acquaintances: {ex.Message}");
            throw new InvalidOperationException(
                $"Error retrieving user acquaintances: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Add a new person as an acquaintance for the current user - Use when user wants to add a new contact/person to their list")]
    [Parameter("person", "The person object containing name and contact information to add as an acquaintance")]
    [Returns("The created person with generated ID if successful")]
    public async Task<Person> AddAcquaintance(Person person)
    {
        var userId = _documentContext.UserId;

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID cannot be empty. Please ensure you are logged in.");
        }

        if (person == null)
        {
            throw new ArgumentNullException(nameof(person));
        }

        if (string.IsNullOrWhiteSpace(person.Name))
        {
            throw new ArgumentException("Person name is required", nameof(person));
        }

        await _thread.SendData(new WorkLog($"Starting to add acquaintance '{person.Name}' for user: {userId}"));

        try
        {
            var createdPerson = await _personRepository.CreateAcquaintanceAsync(userId, person);

            await _thread.SendData(new WorkLog($"Successfully added acquaintance '{createdPerson.Name}' (ID: {createdPerson.Id}) for user {userId}"));
            return createdPerson;
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            _logger.LogWarning($"Attempted to add duplicate acquaintance: {ex.Message}");
            throw new InvalidOperationException(
                $"Cannot add acquaintance: {ex.Message}",
                ex
            );
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while adding acquaintance: {ex.Message}");
            throw new InvalidOperationException(
                $"Error adding acquaintance: {ex.Message}",
                ex
            );
        }
    }
}