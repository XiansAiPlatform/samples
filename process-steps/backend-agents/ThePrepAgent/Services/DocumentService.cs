using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Repositories;
using PowerOfAttorneyAgent.Validations;

namespace PowerOfAttorneyAgent.Services;

public interface IDocumentService
{
    Task<PowerOfAttorney?> GetDocument(Guid documentId);
    Task<AuditResult<PowerOfAttorney>> ValidateDocument(Guid documentId);
}

/// <summary>
/// Service class for managing Power of Attorney documents and their representatives
/// </summary>
public class DocumentService: IDocumentService
{
    private readonly DocumentRepository _repository;
    private readonly UserProfileService _userProfileService;
    private readonly RuleEngine _ruleEngine;
    
    /// <summary>
    /// Initializes a new instance of the PowerOfAttorneyService
    /// </summary>
    public DocumentService()
    {
        _repository = new DocumentRepository();
        _userProfileService = new UserProfileService();
        _ruleEngine = new RuleEngine();
    }

    /// <summary>
    /// Gets a Power of Attorney document from the collection
    /// </summary>
    /// <param name="documentId">The ID of the document</param>
    /// <returns>The document if found, null otherwise</returns>
    public async Task<PowerOfAttorney?> GetDocument(Guid documentId)
    {
        return await _repository.GetDocument(documentId);
    }

    /// <summary>
    /// Gets a Power of Attorney document 
    /// </summary>
    /// <param name="documentId">The ID of the document to get</param>
    /// <returns>The document if found, null otherwise</returns>
    public async Task<AuditResult<PowerOfAttorney>> ValidateDocument(Guid documentId)
    {
        var document = await _repository.GetDocument(documentId);

        if (document == null)
        {
            throw new InvalidOperationException($"Document with id '{documentId}' not found");
        }

        return _ruleEngine.ApplyAllRules(document);
    }

}
