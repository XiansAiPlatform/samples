using XiansAi.Flow.Router.Plugins;
using XiansAi.Messaging;
using PowerOfAttorneyAgent.Services;
using PowerOfAttorneyAgent.Model;
using XiansAi.Logging;
using System.Text.Json;
using Bots;

namespace PowerOfAttorneyAgent.Bots;

public class DocumentCapabilities
{
    private readonly MessageThread _thread;
    private readonly DocumentService _documentService;
    private static readonly Logger<DocumentCapabilities> _logger = Logger<DocumentCapabilities>.For();

    public DocumentCapabilities(MessageThread thread)
    {
        _thread = thread;
        _documentService = new DocumentService();
    }

    [Capability("Show an overview of the power of attorney document")]
    [Returns("Detailed overview of the power of attorney document")]
    public async Task<PowerOfAttorney> GetDocumentOverview()
    {
        var fetchDocument = FetchDocument.FromThread(_thread);
        var documentId = fetchDocument.DocumentId;
        _logger.LogInformation($"Starting GetDocumentOverview for documentId: {documentId}");
        
        try
        {
            var document = await _documentService.GetDocument(documentId);
            if (document == null)
            {
                throw new Exception("No power of attorney document found.");
            }

            _logger.LogInformation("Successfully retrieved document overview");

            var json = JsonSerializer.Serialize(document);
            _logger.LogInformation($"Document overview: {json}");
            return document;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while getting document overview: {ex.Message}");
            throw new Exception($"Error retrieving document overview: {ex.Message}");
        }
    }

} 