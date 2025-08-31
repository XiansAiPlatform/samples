using Services;
using XiansAi.Flow.Router.Plugins;
using XiansAi.Logging;
using XiansAi.Messaging;
using Agents.Utils;
using Repositories;

namespace Agents.LegalContract;

public class GeneralCapabilities
{
    private readonly MessageThread _thread;

    private readonly DocumentContext _documentContext;
    private readonly ContractRepository _contractRepository;
    private readonly ContractUpdateCommand _contractUpdateService;
    private static readonly Logger<GeneralCapabilities> _logger =
        Logger<GeneralCapabilities>.For();

    public GeneralCapabilities(MessageThread thread)
    {
        _thread = thread;
        _documentContext = new DocumentContext(_thread);
        _contractRepository = new ContractRepository();
        _contractUpdateService = new ContractUpdateCommand(_contractRepository, _thread);
    }


    [Capability("Create a new legal contract document from scratch - Use when user wants to start a new contract or has no existing contract ID")]
    [Parameter("title", "Descriptive title for the new contract (e.g., 'Software Development Agreement', 'Service Contract')")]
    [Returns("Response message hint")]
    public async Task<string> CreateNewContract(string title)
    {
        await _thread.SendData(new WorkLog($"Starting CreateDocument with title: {title}"));

        try
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                throw new ArgumentException("Contract title cannot be empty or null.", nameof(title));
            }

            var contractId = Guid.NewGuid();

            var contract = _contractRepository.CreateNewContract(title, contractId);
            await _contractRepository.SaveContractAsync(contract);
            await _thread.SendData(new WorkLog($"Contract created with ID `{contractId}`"));
            await _thread.SendData(new UICommand("ContractLink", new Dictionary<string, object> { { "id", contractId } }));

            return $"Contract created with ID `{contractId}`. Open the contract to continue working with it. Do not ask user to edit any fields.";
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while creating contract document: {ex.Message}");
            throw new InvalidOperationException(
                $"Error creating contract document: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Check if there is a currently active contract document in session context - Use to determine if the user has a contract set for the current session")]
    [Returns("True if there is a current contract set in the document context, false otherwise")]
    public bool HasCurrentContract()
    {
        var contractId = _documentContext.DocumentId;
        return contractId.HasValue && contractId.Value != Guid.Empty;
    }

    [Capability("Retrieve the currently active contract document from session context - Use when working with a contract already set in the current session")]
    [Returns("Complete contract object with all sections and validation results")]
    public async Task<ContractWithValidations> GetCurrentContract()
    {

        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        await _thread.SendData(new WorkLog($"Starting to Fetch Contract with ID: {contractId}"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            await _thread.SendData(new WorkLog($"Successfully retrieved contract with ID: {contractId}"));
            
            var validator = new ContractValidator();
            var validationResult = validator.ValidateContract(contract);

            var contractWithValidations = new ContractWithValidations { 
                Contract = contract, 
                Validations = validationResult.Insights
            };

            return contractWithValidations;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while fetching contract document: {ex.Message}");
            throw new InvalidOperationException(
                $"Error retrieving contract document: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Validate the currently active contract document for legal compliance and completeness - Use when user asks to check or validate the contract they're currently working on")]
    [Returns("Comprehensive validation report with critical issues, warnings, and suggestions")]
    public async Task<ValidationResult> ValidateCurrentContract()
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        await _thread.SendData(new WorkLog($"Starting to Validate Contract with ID: {contractId}"));

        try
        {
            // Fetch the contract
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            // Validate the contract using ContractValidator
            var validator = new ContractValidator();
            var validationResult = validator.ValidateContract(contract);

            await _thread.SendData(new WorkLog($"Successfully validated contract with ID: {contractId}. " +
                                 $"Valid: {validationResult.IsValid}, " +
                                 $"Issues: {validationResult.Insights.Count}, " +
                                 $"Critical: {validationResult.Insights.Count(i => i.Severity == InsightSeverity.Critical)}, "));

            return validationResult;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while validating contract document: {ex.Message}");
            throw new InvalidOperationException(
                $"Error validating contract document: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Update the title of the currently active contract document - Use when user wants to change the contract title")]
    [Parameter("newTitle", "New title for the contract document")]
    [Returns("Contract with updated title and validation results")]
    public async Task<ContractWithValidations> UpdateTitle(string newTitle)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        if (string.IsNullOrWhiteSpace(newTitle))
        {
            throw new ArgumentException("Contract title cannot be empty or null.", nameof(newTitle));
        }

        await _thread.SendData(new WorkLog($"Starting to update contract title for ID: {contractId}"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            contract.Title = newTitle;
            var result = await UpdateContract(contract);

            await _thread.SendData(new WorkLog($"Successfully updated contract title to: {newTitle}"));
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while updating contract title: {ex.Message}");
            throw new InvalidOperationException(
                $"Error updating contract title: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Update the created date of the currently active contract document - Use when user wants to change when the contract was originally created")]
    [Parameter("newCreatedDate", "New created date for the contract document")]
    [Returns("Contract with updated created date and validation results")]
    public async Task<ContractWithValidations> UpdateCreatedDate(DateTime newCreatedDate)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        await _thread.SendData(new WorkLog($"Starting to update contract created date for ID: {contractId}"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            contract.CreatedDate = newCreatedDate;
            var result = await UpdateContract(contract);

            await _thread.SendData(new WorkLog($"Successfully updated contract created date to: {newCreatedDate:yyyy-MM-dd}"));
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while updating contract created date: {ex.Message}");
            throw new InvalidOperationException(
                $"Error updating contract created date: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Update the effective date of the currently active contract document - Use when user wants to change when the contract becomes legally effective")]
    [Parameter("newEffectiveDate", "New effective date for the contract document (can be null if not yet determined)")]
    [Returns("Contract with updated effective date and validation results")]
    public async Task<ContractWithValidations> UpdateEffectiveDate(DateTime? newEffectiveDate)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        await _thread.SendData(new WorkLog($"Starting to update contract effective date for ID: {contractId}"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            contract.EffectiveDate = newEffectiveDate;
            var result = await UpdateContract(contract);

            var effectiveDateText = newEffectiveDate?.ToString("yyyy-MM-dd") ?? "null";
            await _thread.SendData(new WorkLog($"Successfully updated contract effective date to: {effectiveDateText}"));
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while updating contract effective date: {ex.Message}");
            throw new InvalidOperationException(
                $"Error updating contract effective date: {ex.Message}",
                ex
            );
        }
    }

    [Capability("Update the description of the currently active contract document - Use when user wants to change the contract description or summary")]
    [Parameter("newDescription", "New description for the contract document")]
    [Returns("Contract with updated description and validation results")]
    public async Task<ContractWithValidations> UpdateDescription(string newDescription)
    {
        var contractId = _documentContext.DocumentId;

        if (contractId is null || contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty. Do you like to create a new document?");
        }

        if (string.IsNullOrWhiteSpace(newDescription))
        {
            throw new ArgumentException("Contract description cannot be empty or null.", nameof(newDescription));
        }

        await _thread.SendData(new WorkLog($"Starting to update contract description for ID: {contractId}"));

        try
        {
            var contract = await _contractRepository.GetContractAsync(contractId.Value);
            if (contract == null)
            {
                throw new InvalidOperationException($"No contract found with ID: {contractId}");
            }

            contract.Description = newDescription;
            var result = await UpdateContract(contract);

            await _thread.SendData(new WorkLog($"Successfully updated contract description"));
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while updating contract description: {ex.Message}");
            throw new InvalidOperationException(
                $"Error updating contract description: {ex.Message}",
                ex
            );
        }
    }

    private async Task<ContractWithValidations> UpdateContract(Contract contract)
    {
        if (contract == null)
        {
            throw new ArgumentException("Contract cannot be null.", nameof(contract));
        }

        if (contract.Id == Guid.Empty)
        {
            throw new ArgumentException("Contract ID cannot be empty.", nameof(contract));
        }

        await _thread.SendData(new WorkLog($"Starting to update contract with ID: {contract.Id}"));

        try
        {
            await _contractUpdateService.ExecuteAsync(contract);

            await _thread.SendData(new WorkLog($"Successfully updated contract with ID: {contract.Id}"));

            var validator = new ContractValidator();
            var validationResult = validator.ValidateContract(contract);

            var contractWithValidations = new ContractWithValidations { 
                Contract = contract, 
                Validations = validationResult.Insights
            };

            await _thread.SendData(new DocumentUpdate(contractWithValidations));

            return contractWithValidations;

        }
        catch (Exception ex)
        {
            _logger.LogError($"Error occurred while updating contract document: {ex.Message}");
            throw new InvalidOperationException(
                $"Error updating contract document: {ex.Message}",
                ex
            );
        }
    }
}
