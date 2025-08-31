using Services;
using XiansAi.Messaging;

namespace Repositories;

public class ContractUpdateCommand
{
    private readonly ContractRepository _contractRepository;
    private readonly MessageThread _thread;

    public ContractUpdateCommand(ContractRepository contractRepository, MessageThread thread)
    {
        _contractRepository = contractRepository;
        _thread = thread;
    }

    /// <summary>
    /// Updates a contract and sends a document update with validations
    /// </summary>
    /// <param name="contract">The contract to update</param>
    /// <returns>Task representing the async operation</returns>
    public async Task ExecuteAsync(Contract contract)
    {
        // Update the contract in the repository
        await _contractRepository.UpdateContractAsync(contract);

        // Validate the updated contract
        var validator = new ContractValidator();
        var validationResult = validator.ValidateContract(contract);

        // Send document update with contract and validations
        await _thread.SendData(new DocumentUpdate(new ContractWithValidations {
            Contract = contract,
            Validations = validationResult.Insights
        }));
    }
}