using System.Text.Json.Serialization;
using Agents.Utils;
using Repositories;
using Services;
using XiansAi.Logging;
using XiansAi.Messaging;

namespace Agents.LegalContract;

public class DocumentRequest {
    [JsonPropertyName("documentId")]
    public Guid DocumentId { get; set; }
}

public class DataProcessor {

    private readonly MessageThread _messageThread;
    private readonly ContractRepository _contractRepository = new();
    private readonly ContractValidator _validator = new();
    private static readonly Logger<DataProcessor> _logger =
    Logger<DataProcessor>.For();
    public DataProcessor(MessageThread messageThread) {
        _logger.LogDebug($"DataProcessor constructor called with message thread: {messageThread.ThreadId}");
        _messageThread = messageThread;
    }

    public async Task<bool> UpdateDocument(Contract contract) {
        _logger.LogDebug($"Updating document request: {contract}");
        await _contractRepository.UpdateContractAsync(contract);
        return true;
    }

    public async Task<DocumentUpdate> GetValidatedDocument(DocumentRequest documentRequest) {
        _logger.LogDebug($"Processing document request: {documentRequest}");
        var contract = await _contractRepository.GetContractByIdAsync(documentRequest.DocumentId);
        _logger.LogDebug($"Contract found: {contract?.Id}");

        if (contract == null) {
            throw new Exception($"Contract not found for document ID: {documentRequest.DocumentId}");
        }

        // Validate the updated contract
        var validationResult = _validator.ValidateContract(contract);
        _logger.LogDebug($"Validation result has {validationResult.Insights.Count} insights");

        var contractWithValidations = new ContractWithValidations {
            Contract = contract,
            Validations = validationResult.Insights
        };
        return new DocumentUpdate(contractWithValidations);
    }

}