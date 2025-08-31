using XiansAi.Flow.Router.Plugins;
using XiansAi.Logging;
using XiansAi.Messaging;
using Agents.Utils;
using Services;
using Repositories;

namespace Agents.LegalContract;

public class TermCapabilities
{
    private readonly MessageThread _thread;
    private readonly DocumentContext _documentContext;
    private readonly ContractRepository _contractRepository;
    private readonly TermRepository _termRepository;
    private readonly ContractUpdateCommand _contractUpdateService;
    private static readonly Logger<TermCapabilities> _logger =
        Logger<TermCapabilities>.For();

    public TermCapabilities(MessageThread thread)
    {
        _thread = thread;
        _documentContext = new DocumentContext(_thread);
        _contractRepository = new ContractRepository();
        _termRepository = new TermRepository();
        _contractUpdateService = new ContractUpdateCommand(_contractRepository, _thread);
    }

    [Capability("Add a predefined term to the currently active contract by its GUID - Use when user wants to add a specific term from the term repository")]
    [Parameter("termId", "The unique identifier of the term to add from the predefined terms repository")]
    [Returns("The term object that was added to the contract")]
    public async Task<Term> AddTerm(Guid termId)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        if (termId == Guid.Empty)
        {
            throw new ArgumentException("Term ID cannot be empty", nameof(termId));
        }

        await _thread.SendData(new WorkLog($"Starting to add term with ID: {termId} to contract ID: {contractId}"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            // Find the term in the repository
            var availableTerms = _termRepository.GetPotentialTerms();
            var termToAdd = availableTerms.FirstOrDefault(t => t.Id == termId);
            
            if (termToAdd == null)
            {
                throw new InvalidOperationException($"No term found with ID: {termId} in the term repository");
            }

            // Check if term already exists in contract
            if (contract.Terms.Any(t => t.Id == termId))
            {
                throw new InvalidOperationException($"Term with ID {termId} already exists in the contract");
            }

            // Create a copy of the term for the contract
            var contractTerm = new Term
            {
                Id = termToAdd.Id,
                Category = termToAdd.Category,
                Text = termToAdd.Text
            };

            contract.Terms.Add(contractTerm);
            await _contractUpdateService.ExecuteAsync(contract);
            

            await _thread.SendData(new WorkLog($"Successfully added {contractTerm.Category} term (ID: {termId}) to contract"));
            return contractTerm;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while adding term: {ex.Message}");
            throw new InvalidOperationException(
                $"Error adding term to contract: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Remove a term from the currently active contract by its GUID - Use when user wants to delete a specific term from the contract")]
    [Parameter("termId", "The unique identifier of the term to remove from the contract")]
    [Returns("True if the term was successfully removed, false if term was not found")]
    public async Task<bool> RemoveTerm(Guid termId)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        if (termId == Guid.Empty)
        {
            throw new ArgumentException("Term ID cannot be empty", nameof(termId));
        }

        await _thread.SendData(new WorkLog($"Starting to remove term with ID: {termId} from contract ID: {contractId}"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            var termToRemove = contract.Terms.FirstOrDefault(t => t.Id == termId);
            if (termToRemove == null)
            {
                await _thread.SendData(new WorkLog($"Term with ID {termId} not found in contract"));
                return false;
            }

            contract.Terms.Remove(termToRemove);
            await _contractUpdateService.ExecuteAsync(contract);

            await _thread.SendData(new WorkLog($"Successfully removed {termToRemove.Category} term (ID: {termId}) from contract"));
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while removing term: {ex.Message}");
            throw new InvalidOperationException(
                $"Error removing term from contract: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Edit the text content of an existing term in the currently active contract - Use when user wants to modify the wording of a specific term")]
    [Parameter("termId", "The unique identifier of the term to edit")]
    [Parameter("newText", "The new text content for the term")]
    [Returns("The updated term object with the new text")]
    public async Task<Term> EditTermText(Guid termId, string newText)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        if (termId == Guid.Empty)
        {
            throw new ArgumentException("Term ID cannot be empty", nameof(termId));
        }

        if (string.IsNullOrWhiteSpace(newText))
        {
            throw new ArgumentException("New text cannot be empty or null", nameof(newText));
        }

        await _thread.SendData(new WorkLog($"Starting to edit term with ID: {termId} in contract ID: {contractId}"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            var termToEdit = contract.Terms.FirstOrDefault(t => t.Id == termId);
            if (termToEdit == null)
            {
                throw new InvalidOperationException($"Term with ID {termId} not found in contract");
            }

            var oldText = termToEdit.Text;
            termToEdit.Text = newText;

            await _contractUpdateService.ExecuteAsync(contract);

            await _thread.SendData(new WorkLog($"Successfully updated {termToEdit.Category} term (ID: {termId}) text"));
            await _thread.SendData(new WorkLog($"Previous text: {oldText}"));
            await _thread.SendData(new WorkLog($"New text: {newText}"));
            
            return termToEdit;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while editing term: {ex.Message}");
            throw new InvalidOperationException(
                $"Error editing term in contract: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Get all available predefined terms from the term repository - Use when user wants to see what terms are available to add")]
    [Returns("List of all predefined terms organized by category")]
    public List<Term> GetAvailableTerms()
    {
        try
        {
            var terms = _termRepository.GetPotentialTerms();
            _logger.LogInformation($"Retrieved {terms.Count} available terms from repository");
            return terms;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while retrieving available terms: {ex.Message}");
            throw new InvalidOperationException(
                $"Error retrieving available terms: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Get available predefined terms filtered by category - Use when user wants to see terms for a specific category")]
    [Parameter("category", "The term category to filter by (e.g., Financial, Liability, Confidentiality)")]
    [Returns("List of predefined terms for the specified category")]
    public List<Term> GetAvailableTermsByCategory(TermCategory category)
    {
        try
        {
            var terms = _termRepository.GetPotentialTermsByCategory(category);
            _logger.LogInformation($"Retrieved {terms.Count} available terms for category {category}");
            return terms;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while retrieving terms for category {category}: {ex.Message}");
            throw new InvalidOperationException(
                $"Error retrieving terms for category {category}: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Get all terms currently in the active contract - Use when user wants to see what terms are already in the contract")]
    [Returns("List of all terms currently added to the contract")]
    public async Task<List<Term>> GetCurrentContractTerms()
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            _logger.LogInformation($"Retrieved {contract.Terms.Count} terms from current contract");
            return contract.Terms.ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while retrieving contract terms: {ex.Message}");
            throw new InvalidOperationException(
                $"Error retrieving contract terms: {ex.Message}",
                ex
            );
        }
    }
}