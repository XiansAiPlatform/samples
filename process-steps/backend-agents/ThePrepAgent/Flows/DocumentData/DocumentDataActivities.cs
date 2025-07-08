using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Services;
using Temporalio.Activities;
using XiansAi.Logging;

public interface IDocumentDataActivities
{
    [Activity]
    Task<PowerOfAttorney?> GetDocumentData(Guid documentId);

    [Activity]
    Task<AuditResult<PowerOfAttorney>> ValidateDocument(Guid documentId);
}

public class DocumentDataActivities: IDocumentDataActivities
{
    private static readonly Logger<DocumentDataActivities> _logger = Logger<DocumentDataActivities>.For();

    private readonly IDocumentService _documentService;

    public DocumentDataActivities()
    {
        _logger.LogInformation("DocumentDataActivities constructor");
        _documentService = new DocumentService();
    }

    public async Task<PowerOfAttorney?> GetDocumentData(Guid documentId)
    {
        _logger.LogInformation($"Getting document data for documentId: {documentId}");
        var document = await _documentService.GetDocument(documentId);
        return document;
    }


    public async Task<AuditResult<PowerOfAttorney>> ValidateDocument(Guid documentId)
    {
        var documentService = new DocumentService();
        var result = await documentService.ValidateDocument(documentId);
        return result;
    }
}