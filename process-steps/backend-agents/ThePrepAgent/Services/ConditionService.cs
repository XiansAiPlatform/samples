using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Repositories;
using PowerOfAttorneyAgent.Validations;

namespace PowerOfAttorneyAgent.Services;

/// <summary>
/// Service class for managing Power of Attorney documents and their representatives
/// </summary>
public class ConditionService
{
    private readonly DocumentRepository _repository;
    private readonly UserProfileService _userProfileService;
    private readonly RuleEngine _ruleEngine;
    
    /// <summary>
    /// Initializes a new instance of the PowerOfAttorneyService
    /// </summary>
    public ConditionService()
    {
        _repository = new DocumentRepository();
        _userProfileService = new UserProfileService();
        _ruleEngine = new RuleEngine();
    }


    public async Task<bool> AddCondition(Guid documentId, Condition condition)
    {
        var document = await _repository.GetDocument(documentId) ?? throw new InvalidOperationException("Document not found");
        document.Conditions.Add(condition);
        return _repository.SaveDocument(documentId, document);
    }

    public async Task<List<Condition>> ListConditions(Guid documentId)
    {
        var document = await _repository.GetDocument(documentId) ?? throw new InvalidOperationException("Document not found");
        return document.Conditions;
    }

    public async Task<bool> RemoveCondition(Guid documentId, Guid conditionId)
    {
        var document = await _repository.GetDocument(documentId) ?? throw new InvalidOperationException("Document not found");
        var condition = document.Conditions.FirstOrDefault(c => c.Id == conditionId);
        if (condition != null)
        {
            document.Conditions.Remove(condition);
            return _repository.SaveDocument(documentId, document);
        }
        return _repository.SaveDocument(documentId, document);
    }

    public async Task<bool> UpdateCondition(Guid documentId, Condition condition)
    {
        var document = await _repository.GetDocument(documentId) ?? throw new InvalidOperationException("Document not found");
        var existingCondition = document.Conditions.FirstOrDefault(c => c.Id == condition.Id);
        if (existingCondition != null)
        {
            document.Conditions.Remove(existingCondition);
            document.Conditions.Add(condition);
            return _repository.SaveDocument(documentId, document);
        }
        return _repository.SaveDocument(documentId, document);
    }

}
