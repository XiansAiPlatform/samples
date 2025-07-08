using XiansAi.Flow.Router.Plugins;
using XiansAi.Messaging;
using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;
using XiansAi.Logging;
using Bots;
using PowerOfAttorneyAgent.Flows;
using System.Text.Json.Serialization;

namespace PowerOfAttorneyAgent.Bots;

public class RepresentativeCapabilities
{
    private MessageThread _thread;
    private readonly RepresentativeService _representativeService;
    private readonly UserProfileService _userProfileService;

    private static readonly Logger<RepresentativeCapabilities> _logger = Logger<RepresentativeCapabilities>.For();

    public RepresentativeCapabilities(MessageThread thread)
    {
        _thread = thread;
        _representativeService = new RepresentativeService();
        _userProfileService = new UserProfileService();
    }


    [Capability(@"List all available acquaintances that can be selected and added as representatives to the power of attorney.
      Use this function to find the correct acquaintance ID when user refers to them by name, national ID or any other identifier. This returns acquaintances with their Guid IDs that can be used with AddRepresentativeByAcquaintanceId().")]
    [Returns("List of available acquaintances that can be added as representatives")]
    public async Task<List<Acquaintance>> ListAvailableAcquaintances()
    {
        var metadata = DocumentContext.FromThread(_thread);
        if (!Guid.TryParse(_thread.ParticipantId, out var userId))
            throw new InvalidOperationException("Failed to parse user ID from participant ID");
        var documentId = metadata.DocumentId;
        var acquaintances = _userProfileService.GetAcquaintances(userId);
        _logger.LogInformation($"Retrieved {acquaintances.Count} acquaintances");

        var currentRepresentatives = await _representativeService.ListRepresentatives(documentId) ?? new List<Representative>();
        _logger.LogInformation($"Retrieved {currentRepresentatives?.Count ?? 0} current representatives");

        // Convert acquaintances to representatives, excluding those already added
        var potentialAcquaintances = acquaintances
            .Where(a => !currentRepresentatives!.Any(r => r.NationalId == a.NationalIdNumber))
            .ToList();

        // push a system message to the thread with the updated document
        var activityLog = await new ActivityLog(documentId) { 
            Summary = $" I found {(potentialAcquaintances.Count == 0 ? "no" : potentialAcquaintances.Count)} potential representatives in your relationships", 
            Details = $"Potential representatives: {string.Join(", ", potentialAcquaintances.Select(a => a.FullName))}",
            RequestId = String.Empty
        }.WithValidatedDocument();
        await _thread.SendData(activityLog);


        _logger.LogInformation($"Returning {potentialAcquaintances.Count} potential representatives from acquaintances");
        return potentialAcquaintances;
    }

    [Capability("Show which representatives are currently included in the power of attorney document")]
    [Returns("List of representatives currently added to the power of attorney document")]
    public async Task<List<Representative>> ListCurrentRepresentatives()
    {
        var metadata = DocumentContext.FromThread(_thread);
        var documentId = metadata.DocumentId;
        var representatives = await _representativeService.ListRepresentatives(documentId);
        _logger.LogInformation($"Retrieved {representatives.Count} current representatives for document: {documentId}");

        // push a system message to the thread with the updated document
        var activityLog = await new ActivityLog(documentId) { 
            Summary = $" Currently there are {(representatives.Count == 0 ? "no" : representatives.Count)} representatives", 
            Details = $"Current representatives: {string.Join(", ", representatives.Select(r => r.FullName))}",
            RequestId = String.Empty
        }.WithValidatedDocument();
        await _thread.SendData(activityLog);

        // return the representatives
        return representatives;

    }

    [Capability(@"Add a selected acquaintance to the power of attorney document as a representative.
      REQUIRED PRE-STEP: Call ListAvailableAcquaintances() first, locate the acquaintance whose name / national ID / relationship best matches the user's description, extract its AcquaintanceId and pass THAT GUID to this method. Never ask the user for a GUID.")]
    [Parameter("acquaintanceId", "Guid of the acquaintance to add")]
    [Returns("Confirmation of acquaintance added to power of attorney as a representative")]
    public async Task<string> AddRepresentativeByAcquaintanceId(Guid acquaintanceId)
    {
        var documentContext = DocumentContext.FromThread(_thread);
        if (!Guid.TryParse(_thread.ParticipantId, out var userId))
            throw new InvalidOperationException("Failed to parse user ID from participant ID");

        var documentId = documentContext.DocumentId;
        _logger.LogInformation($"Starting AddRepresentativeById for acquaintanceId: {acquaintanceId}, userId: {userId}, documentId: {documentId}");

        // add the representative to the document
        var representative = await _representativeService.AddRepresentativeFromAcquaintance(userId, documentId, acquaintanceId);

        // push a system message to the thread with the updated document
        var activityLog = await new ActivityLog(documentId) { 
            Summary = $"Added `{representative.FullName}` as a representative.", 
            Details = $"Representative added with national ID `{representative.NationalId}` and relationship `{representative.Relationship}`",
            RequestId = String.Empty
        }.WithValidatedDocument();
        await _thread.SendData(activityLog);

        return "Successfully added representative to power of attorney.";
    }

    // Remove Representatives

    [Capability(@"Remove an existing representative from the power of attorney document.
      REQUIRED PRE-STEP: Call ListCurrentRepresentatives() first, locate the representative whose name / relationship best matches the user's description, extract its Id and pass THAT GUID to this method. Never ask the user for a GUID.")]
    [Parameter("representativeId", "Guid of the representative to remove")]
    [Returns("Confirmation of representative removed from power of attorney")]
    public async Task<string> RemoveRepresentativeById(Guid representativeId)
    {
        // Get current representatives
        var documentContext = DocumentContext.FromThread(_thread);
        var documentId = documentContext.DocumentId;
        var currentRepresentatives = await _representativeService.ListRepresentatives(documentId) ?? new List<Representative>();

        // Find the representative to remove
        var representativeToRemove = currentRepresentatives.FirstOrDefault(r => r.Id == representativeId);
        if (representativeToRemove == null)
        {
            throw new InvalidOperationException($"Representative with id '{representativeId}' not found in the power of attorney document.");
        }

        // Remove the representative using their national ID
        await _representativeService.RemoveRepresentative(documentId, representativeToRemove.Id);

        // push a system message to the thread with the updated document
        var activityLog = await new ActivityLog(documentId) { 
            Summary = $"Removed `{representativeToRemove.FullName}` as a representative.", 
            Details = $"Representative removed with national ID `{representativeToRemove.NationalId}` and relationship `{representativeToRemove.Relationship}`",
            RequestId = String.Empty
        }.WithValidatedDocument();

        await _thread.SendData(activityLog);

        return "Successfully removed representative from power of attorney.";
    }

    [Capability("Conduct a legal review of the power of attorney document")]
    [Returns("Legal review of the power of attorney document")]
    public async Task<string> ConductLegalReview()
    {
        var documentContext = DocumentContext.FromThread(_thread);
        if (!Guid.TryParse(_thread.ParticipantId, out var userId))
            throw new InvalidOperationException("Failed to parse user ID from participant ID");

        var documentId = documentContext.DocumentId;
        _logger.LogInformation($"Sending legal review flow message for document: {documentId}");
        await MessageHub.SendFlowMessage(typeof(LegalReviewFlow), new LegalReviewFlowMessage { DocumentId = documentId.ToString() });
        return "Power of attorney document is successfully sent for legal review.";
    }

}

class LegalReviewFlowMessage
{
    [JsonPropertyName("documentId")]
    public required string DocumentId { get; set; }
}
