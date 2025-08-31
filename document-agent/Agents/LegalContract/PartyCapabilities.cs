using Services;
using XiansAi.Flow.Router.Plugins;
using XiansAi.Logging;
using XiansAi.Messaging;
using Agents.Utils;
using Repositories;

namespace Agents.LegalContract;

public class PartyCapabilities
{
    private readonly MessageThread _thread;
    private readonly DocumentContext _documentContext;
    private readonly ContractRepository _contractRepository;
    private readonly PersonRepository _personRepository;
    private readonly ContractUpdateCommand _contractUpdateService;
    private static readonly Logger<PartyCapabilities> _logger =
        Logger<PartyCapabilities>.For();

    public PartyCapabilities(MessageThread thread)
    {
        _thread = thread;
        _documentContext = new DocumentContext(_thread);
        _contractRepository = new ContractRepository();
        _personRepository = new PersonRepository();
        _contractUpdateService = new ContractUpdateCommand(_contractRepository, _thread);
    }

    [Capability("Add a new party to the currently active contract document - Use when user wants to add a contracting party")]
    [Parameter("role", "The role of the party in the contract")]
    [Parameter("name", "The name of the party")]
    [Parameter("representativeIds", "Array of person IDs who will act as representatives for this party")]
    [Parameter("signatoryIds", "Array of person IDs who will act as signatories for this party")]
    [Returns("The party object with generated ID if successful")]
    public async Task<Party> AddParty(string role, string name, Guid[] representativeIds, Guid[] signatoryIds)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Party name is required", nameof(name));
        }

        if (string.IsNullOrWhiteSpace(role))
        {
            throw new ArgumentException("Party role is required", nameof(role));
        }

        representativeIds ??= Array.Empty<Guid>();
        signatoryIds ??= Array.Empty<Guid>();

        await _thread.SendData(new WorkLog($"Starting to add party '{name}' with role '{role}' to contract ID: {contractId}"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            // Create new party
            var party = new Party
            {
                Id = Guid.NewGuid(),
                Name = name,
                Role = role
            };

            // Check if party with same ID already exists (very unlikely with new GUID)
            if (contract.Parties.Any(p => p.Id == party.Id))
            {
                throw new InvalidOperationException($"Party with ID {party.Id} already exists in the contract");
            }

            // Fetch and add representatives
            foreach (var representativeId in representativeIds)
            {
                var representative = await _personRepository.GetAcquaintanceAsync(representativeId);
                if (representative == null)
                {
                    throw new InvalidOperationException($"No person found with ID: {representativeId}");
                }
                party.Representatives.Add(representative);
            }

            // Fetch and add signatories
            foreach (var signatoryId in signatoryIds)
            {
                var signatory = await _personRepository.GetAcquaintanceAsync(signatoryId);
                if (signatory == null)
                {
                    throw new InvalidOperationException($"No person found with ID: {signatoryId}");
                }
                party.Signatories.Add(signatory);
            }

            contract.Parties.Add(party);
            await _contractUpdateService.ExecuteAsync(contract);

            var representativesLog = party.Representatives.Any() ? $" with {party.Representatives.Count} representative(s)" : "";
            var signatoriesLog = party.Signatories.Any() ? $" and {party.Signatories.Count} signatory(ies)" : "";
            await _thread.SendData(new WorkLog($"Successfully added party '{party.Name}' (ID: {party.Id}) to contract{representativesLog}{signatoriesLog}"));
            return party;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while adding party: {ex.Message}");
            throw new InvalidOperationException(
                $"Error adding party to contract: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Add a representative to an existing party in the currently active contract - Use when user wants to add a person as a representative for a party")]
    [Parameter("partyId", "The unique identifier of the party")]
    [Parameter("personId", "The unique identifier of the person to add as representative")]
    [Returns("True if the representative was successfully added, false otherwise")]
    public async Task<bool> AddRepresentative(Guid partyId, Guid personId)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        if (partyId == Guid.Empty)
        {
            throw new ArgumentException("Party ID cannot be empty", nameof(partyId));
        }

        if (personId == Guid.Empty)
        {
            throw new ArgumentException("Person ID cannot be empty", nameof(personId));
        }

        await _thread.SendData(new WorkLog($"Starting to add representative (Person ID: {personId}) to party (ID: {partyId})"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            var party = contract.Parties.FirstOrDefault(p => p.Id == partyId);
            if (party == null)
            {
                throw new InvalidOperationException($"No party found with ID: {partyId}");
            }

            var person = await _personRepository.GetAcquaintanceAsync(personId);
            if (person == null)
            {
                throw new InvalidOperationException($"No person found with ID: {personId}");
            }

            // Check if person is already a representative
            if (party.Representatives.Any(r => r.Id == personId))
            {
                throw new InvalidOperationException($"Person {person.Name} is already a representative for party {party.Name}");
            }

            party.Representatives.Add(person);
            await _contractUpdateService.ExecuteAsync(contract);

            await _thread.SendData(new WorkLog($"Successfully added {person.Name} as representative for party {party.Name}"));
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while adding representative: {ex.Message}");
            throw new InvalidOperationException(
                $"Error adding representative: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Remove a representative from an existing party in the currently active contract - Use when user wants to remove a person as a representative for a party")]
    [Parameter("partyId", "The unique identifier of the party")]
    [Parameter("personId", "The unique identifier of the person to remove as representative")]
    [Returns("True if the representative was successfully removed, false if not found")]
    public async Task<bool> RemoveRepresentative(Guid partyId, Guid personId)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        if (partyId == Guid.Empty)
        {
            throw new ArgumentException("Party ID cannot be empty", nameof(partyId));
        }

        if (personId == Guid.Empty)
        {
            throw new ArgumentException("Person ID cannot be empty", nameof(personId));
        }

        await _thread.SendData(new WorkLog($"Starting to remove representative (Person ID: {personId}) from party (ID: {partyId})"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            var party = contract.Parties.FirstOrDefault(p => p.Id == partyId);
            if (party == null)
            {
                throw new InvalidOperationException($"No party found with ID: {partyId}");
            }

            var representative = party.Representatives.FirstOrDefault(r => r.Id == personId);
            if (representative == null)
            {
                await _thread.SendData(new WorkLog($"Representative with ID {personId} not found in party {party.Name}"));
                return false;
            }

            party.Representatives.Remove(representative);
            await _contractUpdateService.ExecuteAsync(contract);

            await _thread.SendData(new WorkLog($"Successfully removed {representative.Name} as representative from party {party.Name}"));
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while removing representative: {ex.Message}");
            throw new InvalidOperationException(
                $"Error removing representative: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Add a signatory to an existing party in the currently active contract - Use when user wants to add a person as a signatory for a party")]
    [Parameter("partyId", "The unique identifier of the party")]
    [Parameter("personId", "The unique identifier of the person to add as signatory")]
    [Returns("True if the signatory was successfully added, false otherwise")]
    public async Task<bool> AddSignatory(Guid partyId, Guid personId)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        if (partyId == Guid.Empty)
        {
            throw new ArgumentException("Party ID cannot be empty", nameof(partyId));
        }

        if (personId == Guid.Empty)
        {
            throw new ArgumentException("Person ID cannot be empty", nameof(personId));
        }

        await _thread.SendData(new WorkLog($"Starting to add signatory (Person ID: {personId}) to party (ID: {partyId})"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            var party = contract.Parties.FirstOrDefault(p => p.Id == partyId);
            if (party == null)
            {
                throw new InvalidOperationException($"No party found with ID: {partyId}");
            }

            var person = await _personRepository.GetAcquaintanceAsync(personId);
            if (person == null)
            {
                throw new InvalidOperationException($"No person found with ID: {personId}");
            }

            // Check if person is already a signatory
            if (party.Signatories.Any(s => s.Id == personId))
            {
                throw new InvalidOperationException($"Person {person.Name} is already a signatory for party {party.Name}");
            }

            party.Signatories.Add(person);
            await _contractUpdateService.ExecuteAsync(contract);

            await _thread.SendData(new WorkLog($"Successfully added {person.Name} as signatory for party {party.Name}"));
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while adding signatory: {ex.Message}");
            throw new InvalidOperationException(
                $"Error adding signatory: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Remove a signatory from an existing party in the currently active contract - Use when user wants to remove a person as a signatory for a party")]
    [Parameter("partyId", "The unique identifier of the party")]
    [Parameter("personId", "The unique identifier of the person to remove as signatory")]
    [Returns("True if the signatory was successfully removed, false if not found")]
    public async Task<bool> RemoveSignatory(Guid partyId, Guid personId)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        if (partyId == Guid.Empty)
        {
            throw new ArgumentException("Party ID cannot be empty", nameof(partyId));
        }

        if (personId == Guid.Empty)
        {
            throw new ArgumentException("Person ID cannot be empty", nameof(personId));
        }

        await _thread.SendData(new WorkLog($"Starting to remove signatory (Person ID: {personId}) from party (ID: {partyId})"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            var party = contract.Parties.FirstOrDefault(p => p.Id == partyId);
            if (party == null)
            {
                throw new InvalidOperationException($"No party found with ID: {partyId}");
            }

            var signatory = party.Signatories.FirstOrDefault(s => s.Id == personId);
            if (signatory == null)
            {
                await _thread.SendData(new WorkLog($"Signatory with ID {personId} not found in party {party.Name}"));
                return false;
            }

            party.Signatories.Remove(signatory);
            await _contractUpdateService.ExecuteAsync(contract);

            await _thread.SendData(new WorkLog($"Successfully removed {signatory.Name} as signatory from party {party.Name}"));
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while removing signatory: {ex.Message}");
            throw new InvalidOperationException(
                $"Error removing signatory: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Remove a party from the currently active contract document - Use when user wants to remove a contracting party")]
    [Parameter("partyId", "The unique identifier of the party to remove")]
    [Returns("True if the party was successfully removed, false if not found")]
    public async Task<bool> RemoveParty(Guid partyId)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        if (partyId == Guid.Empty)
        {
            throw new ArgumentException("Party ID cannot be empty", nameof(partyId));
        }

        await _thread.SendData(new WorkLog($"Starting to remove party with ID: {partyId} from contract ID: {contractId}"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            var party = contract.Parties.FirstOrDefault(p => p.Id == partyId);
            if (party == null)
            {
                await _thread.SendData(new WorkLog($"Party with ID {partyId} not found in contract"));
                return false;
            }

            contract.Parties.Remove(party);
            await _contractUpdateService.ExecuteAsync(contract);

            await _thread.SendData(new WorkLog($"Successfully removed party '{party.Name}' (ID: {partyId}) from contract"));
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while removing party: {ex.Message}");
            throw new InvalidOperationException(
                $"Error removing party from contract: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Get all parties from the currently active contract document - Use when user wants to view all parties in the current contract")]
    [Returns("List of all parties in the current contract with their details (name, role, representatives, signatories)")]
    public async Task<List<Party>> GetParties()
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        await _thread.SendData(new WorkLog($"Starting to retrieve parties from contract ID: {contractId}"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            await _thread.SendData(new WorkLog($"Successfully retrieved {contract.Parties.Count} parties from contract"));
            return contract.Parties.OrderBy(p => p.Name).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while retrieving parties: {ex.Message}");
            throw new InvalidOperationException(
                $"Error retrieving parties from contract: {ex.Message}",
                ex
            );
        }
    }
}
