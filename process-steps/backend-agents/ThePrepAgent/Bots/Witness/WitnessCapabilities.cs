using XiansAi.Flow.Router.Plugins;
using XiansAi.Messaging;
using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;
using XiansAi.Logging;
using Bots;

namespace PowerOfAttorneyAgent.Bots;

public class WitnessCapabilities
{
    private MessageThread _thread;
    private readonly DocumentService _documentService;
    private readonly WitnessService _witnessService;
    private readonly UserProfileService _userProfileService;

    private static readonly Logger<WitnessCapabilities> _logger = Logger<WitnessCapabilities>.For();

    public WitnessCapabilities(MessageThread thread)
    {
        _thread = thread;
        _documentService = new DocumentService();
        _witnessService = new WitnessService();
        _userProfileService = new UserProfileService();
    }

    [Capability("List all available witnesses that can be selected from acquaintances to be added to the power of attorney")]
    [Returns("List of potential witnesses from acquaintances that can be added")]
    public async Task<List<Witness>> ListPotentialWitnessesFromAcquaintances()
    {
        var metadata = DocumentContext.FromThread(_thread);
        if (!Guid.TryParse(_thread.ParticipantId, out var userId))
            throw new InvalidOperationException("Failed to parse user ID from participant ID");
        var documentId = metadata.DocumentId;
        var acquaintances = _userProfileService.GetAcquaintances(userId);
        _logger.LogInformation($"Retrieved {acquaintances.Count} acquaintances");

        var currentWitnesses = await _witnessService.ListWitnesses(documentId);
        _logger.LogInformation($"Retrieved {currentWitnesses?.Count ?? 0} current witnesses");

        var potentialWitnesses = acquaintances
            .Where(a => !(currentWitnesses ?? new List<Witness>()).Any(w => w.NationalIdNumber == a.NationalIdNumber))
            .Select(a => new Witness
            {
                // Reuse the acquaintance's unique ID so the caller can pass it directly
                // into AddWitnessByAcquaintanceId(acquaintanceId).
                WitnessId = a.AcquaintanceId,
                FullName = a.FullName,
                NationalIdNumber = a.NationalIdNumber,
            })
            .ToList();

        // push a system message to the thread with the updated document
        await _thread.SendData(await _documentService.ValidateDocument(documentId));

        _logger.LogInformation($"Returning {potentialWitnesses.Count.ToString()} potential witnesses from acquaintances");
        return potentialWitnesses;

    }

    [Capability("Show which witnesses are currently included in the power of attorney document")]
    [Returns("List of witnesses currently added to the power of attorney document")]
    public async Task<List<Witness>> ListExistingWitnesses()
    {
        var metadata = DocumentContext.FromThread(_thread);
        var documentId = metadata.DocumentId;
        var witnesses = await _witnessService.ListWitnesses(documentId);
        _logger.LogInformation($"Retrieved {witnesses.Count} current witnesses for document: {documentId}");

        // push a system message to the thread with the updated document
        await _thread.SendData(await _documentService.ValidateDocument(documentId));

        return witnesses;
    }

    [Capability(@"Add a selected acquaintance as a witness to the power of attorney document.
    REQUIRED PRE-STEP: Call ListPotentialWitnessesFromAcquaintances() (or RepresentativeCapabilities.ListAvailableAcquaintances()) first, locate the acquaintance that matches the user's description (by name or national ID), extract its AcquaintanceId and pass THAT GUID to this method. Never ask the user for a GUID.")]
    [Parameter("acquaintanceId", "Guid of the acquaintance to add as a witness")]
    [Returns("Confirmation of witness added to power of attorney")]
    public async Task<string> AddWitnessByAcquaintanceId(Guid acquaintanceId)
    {
        var metadata = DocumentContext.FromThread(_thread);
        if (!Guid.TryParse(_thread.ParticipantId, out var userId))
            throw new InvalidOperationException("Failed to parse user ID from participant ID");
        var documentId = metadata.DocumentId;
        _logger.LogInformation($"Fetching acquaintance details for acquaintanceId: {acquaintanceId}");
        var acquaintance = _userProfileService.GetAcquaintanceById(userId, acquaintanceId)
          ?? throw new Exception($"Acquaintance with id {acquaintanceId} not found");

        var currentWitnesses = await _witnessService.ListWitnesses(documentId) ?? new List<Witness>();
        if (currentWitnesses.Any(w => w.NationalIdNumber == acquaintance.NationalIdNumber))
        {
            _logger.LogWarning($"Witness already exists: {acquaintance.FullName}");
            return "Error: This person is already a witness in the power of attorney.";
        }

        var witness = new Witness
        {
            WitnessId = Guid.NewGuid(),
            FullName = acquaintance.FullName,
            NationalIdNumber = acquaintance.NationalIdNumber
        };

        await _witnessService.AddWitness(documentId, witness);

        // push a system message to the thread with the updated document
        await _thread.SendData(await _documentService.ValidateDocument(documentId));

        return $"Successfully added {witness.FullName} as a witness to the power of attorney.";

    }

    [Capability(@"Add a new witness to the power of attorney document by providing their details.
    This is an alternative to adding a witness from acquaintances, 
    which is preferred when the person is not in the user's acquaintances list.
    Always ask for the full name and national ID of the new witness.")]
    [Parameter("fullName", "Full name of the new witness")]
    [Parameter("nationalId", "National ID of the new witness")]
    [Returns("Confirmation of new witness added to power of attorney")]
    public async Task<string> AddNewWitness(string fullName, string nationalId)
    {
        var metadata = DocumentContext.FromThread(_thread);
        var documentId = metadata.DocumentId;
        _logger.LogInformation($"Starting AddNewWitness for fullName: {fullName}, nationalId: {nationalId}, documentId: {documentId}");

        if (string.IsNullOrWhiteSpace(fullName))
        {
            _logger.LogWarning("Full name cannot be empty for a new witness.");
            return "Error: Full name cannot be empty.";
        }
        if (string.IsNullOrWhiteSpace(nationalId))
        {
            _logger.LogWarning("National ID cannot be empty for a new witness.");
            return "Error: National ID cannot be empty.";
        }

        var currentWitnesses = await _witnessService.ListWitnesses(documentId) ?? new List<Witness>();
        if (currentWitnesses.Any(w => w.NationalIdNumber == nationalId || w.FullName.Equals(fullName, StringComparison.OrdinalIgnoreCase)))
        {
            _logger.LogWarning($"A witness with the same name or national ID already exists: {fullName} / {nationalId}");
            return "Error: A witness with this name or national ID already exists.";
        }

        // In a real system, you might want to ensure National ID uniqueness across a broader scope or validate its format.

        var witness = new Witness
        {
            WitnessId = Guid.NewGuid(), // Assign a new GUID for a newly created witness
            FullName = fullName,
            NationalIdNumber = nationalId
        };

        await _witnessService.AddWitness(documentId, witness);

        // push a system message to the thread with the updated document
        await _thread.SendData(await _documentService.ValidateDocument(documentId));

        return $"Successfully added {witness.FullName} as a witness to the power of attorney.";

    }


    [Capability(@"Remove an existing witness from the power of attorney document.
    REQUIRED PRE-STEP: Call ListExistingWitnesses() first, locate the witness that matches the user's description (by name or national ID), extract its WitnessId and pass THAT GUID to this method. Never ask the user for a GUID.")]
    [Parameter("witnessId", "ID of the witness to remove")]
    [Returns("Confirmation of witness removed from power of attorney")]
    public async Task<string> RemoveWitnessById(Guid witnessId)
    {
        var metadata = DocumentContext.FromThread(_thread);
        var documentId = metadata.DocumentId;
        _logger.LogInformation($"Starting RemoveWitnessById for witnessId: {witnessId}, documentId: {documentId}");

        var currentWitnesses = await _witnessService.ListWitnesses(documentId) ?? new List<Witness>();
        var witnessToRemove = currentWitnesses.FirstOrDefault(w => w.WitnessId == witnessId);

        if (witnessToRemove == null)
        {
            _logger.LogWarning($"Witness not found with ID: {witnessId} in document: {documentId}");
            return "Error: Witness not found in the power of attorney document.";
        }

        // Assuming NationalId is the unique identifier used by the service to remove.
        // If the service uses the internal Guid (Id) then `witnessToRemove.Id` should be used.
        _logger.LogInformation($"Removing witness: {witnessToRemove.FullName} (ID: {witnessToRemove.WitnessId}, NationalId: {witnessToRemove.NationalIdNumber})");
        await _witnessService.RemoveWitness(documentId, witnessToRemove.NationalIdNumber);

        // push a system message to the thread with the updated document
        await _thread.SendData(await _documentService.ValidateDocument(documentId));

        return "Successfully removed witness from power of attorney.";

    }
}