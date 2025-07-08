using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Repositories;

namespace PowerOfAttorneyAgent.Services;

/// <summary>
/// Service class for managing Power of Attorney documents and their representatives
/// </summary>
public class RepresentativeService
{
    private readonly DocumentRepository _repository;
    private readonly UserProfileService _userProfileService;
    
    /// <summary>
    /// Initializes a new instance of the PowerOfAttorneyService
    /// </summary>
    public RepresentativeService()
    {
        _repository = new DocumentRepository();
        _userProfileService = new UserProfileService();
    }

    public async Task<Representative> AddRepresentativeFromAcquaintance(Guid userId, Guid documentId, Guid acquaintanceId)
    {
        var document = await _repository.GetDocument(documentId) ?? throw new InvalidOperationException("Document not found");

        var acquaintances = _userProfileService.GetAcquaintances(userId);
        var acquaintance = acquaintances.FirstOrDefault(a => a.AcquaintanceId == acquaintanceId) 
          ?? throw new InvalidOperationException($"Acquaintance with ID {acquaintanceId} not found");

        // Check if the representative already exists
        if (document.Representatives.Any(r => r.NationalId == acquaintance.NationalIdNumber))
        {
            throw new InvalidOperationException($"Representative with National ID {acquaintance.NationalIdNumber} already exists");
        }

        var representative = new Representative
        {
            Id = Guid.NewGuid(),
            FullName = acquaintance.FullName,
            NationalId = acquaintance.NationalIdNumber,
            Relationship = acquaintance.Relationship,
            Address = acquaintance.Address
        };

        // Add the representative
        document.Representatives.Add(representative);
        
        _repository.SaveDocument(documentId, document);

        return representative;
    }

    /// <summary>
    /// Removes a representative from the power of attorney document
    /// </summary>
    /// <param name="documentId">The ID of the document to modify</param>
    /// <param name="representativeId">The Guid of the representative to remove</param>
    /// <returns>True if the removal was successful, false otherwise</returns>
    public async Task<bool> RemoveRepresentative(Guid documentId, Guid representativeId)
    {
        var document = await _repository.GetDocument(documentId) ?? throw new InvalidOperationException("Document not found");

        var representative = document.Representatives.FirstOrDefault(r => r.Id == representativeId);
        if (representative == null)
        {
            throw new InvalidOperationException($"Representative with ID {representativeId} not found");
        }

        // Remove the representative
        var removed = document.Representatives.Remove(representative);
        return removed && _repository.SaveDocument(documentId, document);
    }

    /// <summary>
    /// Lists all representatives for a power of attorney document
    /// </summary>
    /// <param name="documentId">The ID of the document</param>
    /// <returns>List of representatives</returns>
    public async Task<List<Representative>> ListRepresentatives(Guid documentId)
    {
        var document = await _repository.GetDocument(documentId) ?? throw new InvalidOperationException("Document not found");
        return document.Representatives;
    }

}
