using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Repositories;
using PowerOfAttorneyAgent.Validations;

namespace PowerOfAttorneyAgent.Services;

/// <summary>
/// Service class for managing Power of Attorney documents and their representatives
/// </summary>
public class WitnessService
{
    private readonly DocumentRepository _repository;
    private readonly UserProfileService _userProfileService;
    private readonly RuleEngine _ruleEngine;
    
    /// <summary>
    /// Initializes a new instance of the PowerOfAttorneyService
    /// </summary>
    public WitnessService()
    {
        _repository = new DocumentRepository();
        _userProfileService = new UserProfileService();
        _ruleEngine = new RuleEngine();
    }

    // Witness Management
    public async Task<List<Witness>> ListWitnesses(Guid documentId)
    {
        var document = await _repository.GetDocument(documentId) ?? throw new InvalidOperationException("Document not found");
        // Ensure Witnesses list is initialized
        if (document.Witnesses == null)
        {
            document.Witnesses = new List<Witness>();
        }
        return document.Witnesses;
    }

    public async Task<bool> AddWitness(Guid documentId, Witness witness)
    {
        var document = await _repository.GetDocument(documentId) ?? throw new InvalidOperationException($"Document with id {documentId} not found");
        // Ensure Witnesses list is initialized
        if (document.Witnesses == null)
        {
            document.Witnesses = new List<Witness>();
        }
        // Basic validation: prevent adding duplicate witness by NationalId or FullName
        if (document.Witnesses.Any(w => w.NationalIdNumber == witness.NationalIdNumber || w.FullName.Equals(witness.FullName, StringComparison.OrdinalIgnoreCase)))
        {
            // Optionally, throw an exception or return a specific status code
            // For now, returning false to indicate failure to add due to duplication.
            return false; 
        }
        document.Witnesses.Add(witness);
        return _repository.SaveDocument(documentId, document);
    }

    public async Task<bool> RemoveWitness(Guid documentId, string nationalId)
    {
        var document = await _repository.GetDocument(documentId) ?? throw new InvalidOperationException("Document not found");
        if (document.Witnesses == null)
        {
            return false; // No witnesses to remove
        }
        var witnessToRemove = document.Witnesses.FirstOrDefault(w => w.NationalIdNumber == nationalId);
        if (witnessToRemove != null)
        {
            document.Witnesses.Remove(witnessToRemove);
            return _repository.SaveDocument(documentId, document);
        }
        return _repository.SaveDocument(documentId, document);
    }

}
