using XiansAi.Flow.Router.Plugins;
using XiansAi.Messaging;
using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;
using XiansAi.Logging;
using Bots;

namespace PowerOfAttorneyAgent.Bots;

public class ConditionCapabilities
{
    private MessageThread _thread;
    private readonly DocumentService _documentService;
    private readonly ConditionService _conditionService;
    private static readonly Logger<ConditionCapabilities> _logger = Logger<ConditionCapabilities>.For();

    public ConditionCapabilities(MessageThread thread)
    {
        _thread = thread;
        _documentService = new DocumentService();
        _conditionService = new ConditionService();
    }

    [Capability(@"Add a condition to the power of attorney document.
    REQUIRED PRE-STEP (if providing relatedId): Call the appropriate listing capability (e.g., RepresentativeCapabilities.ListCurrentRepresentatives() or an asset-listing function), locate the entity that matches the user's description, extract its GUID and pass that value as relatedId. Never ask the user for a GUID.")]
    [Parameter("conditionType", "Type of condition (Asset, Representative, or General)")]
    [Parameter("conditionText", "The text describing the condition")]
    [Parameter("relatedId", "Optional ID of the asset or representative this condition applies to")]
    [Returns("Confirmation of condition added to power of attorney")]
    public async Task<string> AddCondition(ConditionType conditionType, string conditionText, Guid? relatedId = null)
    {
        var documentId = GetDocumentId();
        _logger.LogInformation($"Starting AddCondition for documentId: {documentId}, type: {conditionType}");

        var condition = new Condition
        {
            Id = Guid.NewGuid(),
            Type = conditionType,
            Text = conditionText,
            TargetId = relatedId,
        };


        await _conditionService.AddCondition(documentId, condition);

        // push a system message to the thread with the updated document
        await SendActivityLog(documentId, $"Added condition: {conditionText}", $"Condition type: {conditionType}, Related ID: {relatedId}");

        return "Successfully added condition to power of attorney.";
    }

    private async Task SendActivityLog(Guid documentId, string summary, string details)
    {
        var activityLog = await new ActivityLog(documentId) { 
            Summary = summary, 
            Details = details,
            RequestId = String.Empty
        }.WithValidatedDocument();
        await _thread.SendData(activityLog);
    }

    private Guid GetDocumentId()
    {
        var metadata = DocumentContext.FromThread(_thread);
        if (!Guid.TryParse(_thread.ParticipantId, out var userId))
            throw new InvalidOperationException("Failed to parse user ID from participant ID");
        var documentId = metadata.DocumentId;
        return documentId;
    }   

    [Capability("List all conditions currently set in the power of attorney document")]
    [Parameter("conditionType", "Optional type filter (Asset, Representative, or General)")]
    [Returns("List of conditions in the power of attorney document")]
    public async Task<List<Condition>> ListConditions(ConditionType? conditionType = null)
    {
        var documentId = GetDocumentId();
        _logger.LogInformation($"Starting ListConditions for documentId: {documentId}");

        var conditions = await _conditionService.ListConditions(documentId);

        if (conditionType.HasValue)
        {
            conditions = conditions.Where(c => c.Type == conditionType.Value).ToList();
        }

        // push a system message to the thread with the updated document
        await SendActivityLog(documentId, $"Listed {conditions.Count} conditions", $"Condition type: {conditionType}");

        _logger.LogInformation($"Retrieved {conditions.Count} conditions");
        return conditions;

    }

    [Capability(@"Remove a condition from the power of attorney document.
    REQUIRED PRE-STEP: Call ListConditions() first, locate the condition whose text best matches the user's description, extract its Id and pass THAT GUID to this method. Never ask the user for a GUID.")]
    [Parameter("conditionId", "ID of the condition to remove")]
    [Returns("Confirmation of condition removed from power of attorney")]
    public async Task<string> RemoveCondition(Guid conditionId)
    {   
        var documentId = GetDocumentId();
        await _conditionService.RemoveCondition(documentId, conditionId);

        _logger.LogInformation($"Successfully removed condition: {conditionId}");

        // push a system message to the thread with the updated document
        await SendActivityLog(documentId, $"Removed condition: {conditionId}", $"Condition ID: {conditionId}");

        return "Successfully removed condition from power of attorney.";

    }

    [Capability(@"Edit an existing condition in the power of attorney document.
    REQUIRED PRE-STEP: Call ListConditions() first, locate the condition whose text best matches the user's description, extract its Id and pass THAT GUID to this method. Never ask the user for a GUID.")]
    [Parameter("conditionId", "ID of the condition to edit")]
    [Parameter("newConditionText", "The new text for the condition")]
    [Returns("Confirmation of condition updated in power of attorney")]
    public async Task<string> EditCondition(Guid conditionId, string newConditionText)
    {
        var documentId = GetDocumentId();
        _logger.LogInformation($"Starting EditCondition for conditionId: {conditionId}");

        var conditions = await _conditionService.ListConditions(documentId);
        var condition = conditions.FirstOrDefault(c => c.Id == conditionId);

        if (condition == null)
        {
            _logger.LogWarning($"Condition not found: {conditionId}");
            return "Error: Condition not found in the power of attorney.";
        }

        condition.Text = newConditionText;

        await _conditionService.UpdateCondition(documentId, condition);

        // push a system message to the thread with the updated document
        await SendActivityLog(documentId, $"Updated condition: {conditionId}", $"New condition text: {newConditionText}");

        return "Successfully updated condition in power of attorney.";

    }
}