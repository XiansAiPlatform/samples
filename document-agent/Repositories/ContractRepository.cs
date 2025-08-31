using System.Text.Json;
using Services;

namespace Repositories;
public class ContractRepository
{
    private readonly string _tempDirectory;
    private readonly JsonSerializerOptions _jsonOptions;

    public ContractRepository()
    {
        _tempDirectory = Path.Combine(Path.GetTempPath(), "LegalContracts");
        Directory.CreateDirectory(_tempDirectory);
        
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true,
            PropertyNameCaseInsensitive = true
        };
    }

    /// <summary>
    /// Creates a new contract with a generated GUID
    /// </summary>
    /// <param name="title">Contract title</param>
    /// <param name="contractId">Optional contract ID, will be generated if not provided</param>
    /// <returns>A new Contract instance</returns>
    public Contract CreateNewContract(string title, Guid? contractId = null)
    {
        var contract = new Contract
        {
            Id = contractId ?? Guid.NewGuid(),
            Title = title,
            CreatedDate = DateTime.UtcNow
        };

        return contract;
    }

    /// <summary>
    /// Retrieves a contract by its GUID
    /// </summary>
    /// <param name="contractId">The GUID of the contract</param>
    /// <returns>The contract if found, null otherwise</returns>
    public async Task<Contract?> GetContractAsync(Guid contractId)
    {
        var filePath = Path.Combine(_tempDirectory, $"{contractId}.json");
        
        if (!File.Exists(filePath))
        {
            return null;
        }

        try
        {
            Console.WriteLine($"Reading contract from {filePath}");
            var jsonContent = await File.ReadAllTextAsync(filePath);
            return JsonSerializer.Deserialize<Contract>(jsonContent, _jsonOptions);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error reading contract {contractId}: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Retrieves a contract by its contract ID (not GUID)
    /// </summary>
    /// <param name="contractId">The contract ID string</param>
    /// <returns>The contract if found, null otherwise</returns>
    public async Task<Contract?> GetContractByIdAsync(Guid contractId)
    {
        var contracts = await GetAllContractsAsync();
        return contracts.FirstOrDefault(c => c.Id == contractId);
    }

    /// <summary>
    /// Saves a contract to the file system using its GUID as the filename
    /// </summary>
    /// <param name="contract">The contract to save</param>
    /// <returns>True if successful, false otherwise</returns>
    public async Task SaveContractAsync(Contract contract)
    {
        if (contract.Id == Guid.Empty)
        {
            contract.Id = Guid.NewGuid();
        }

        var filePath = Path.Combine(_tempDirectory, $"{contract.Id}.json");
        
        try
        {
            var jsonContent = JsonSerializer.Serialize(contract, _jsonOptions);
            await File.WriteAllTextAsync(filePath, jsonContent);
            Console.WriteLine($"Contract saved to {filePath}");
        }
        catch (Exception ex)
        {
            throw new Exception($"Error saving contract {contract.Id}: {ex.Message}");
        }
    }

    /// <summary>
    /// Deletes a contract from the file system
    /// </summary>
    /// <param name="contractId">The GUID of the contract to delete</param>
    /// <returns>True if successful, false otherwise</returns>
    public bool DeleteContract(Guid contractId)
    {
        var filePath = Path.Combine(_tempDirectory, $"{contractId}.json");
        
        if (!File.Exists(filePath))
        {
            return false;
        }

        try
        {
            File.Delete(filePath);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting contract {contractId}: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Gets all contracts from the temp directory
    /// </summary>
    /// <returns>A list of all contracts</returns>
    public async Task<List<Contract>> GetAllContractsAsync()
    {
        var contracts = new List<Contract>();
        var files = Directory.GetFiles(_tempDirectory, "*.json");
        
        foreach (var file in files)
        {
            try
            {
                var jsonContent = await File.ReadAllTextAsync(file);
                var contract = JsonSerializer.Deserialize<Contract>(jsonContent, _jsonOptions);
                if (contract != null)
                {
                    contracts.Add(contract);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reading contract file {file}: {ex.Message}");
            }
        }
        
        return contracts.OrderByDescending(c => c.CreatedDate).ToList();
    }

    /// <summary>
    /// Updates an existing contract
    /// </summary>
    /// <param name="contract">The contract to update</param>
    /// <returns>True if successful, false otherwise</returns>
    public async Task UpdateContractAsync(Contract contract)
    {
        var existingContract = await GetContractAsync(contract.Id);
        if (existingContract == null)
        {
            throw new Exception($"Contract with ID {contract.Id} not found. Update failed.");
        }

        await SaveContractAsync(contract);
    }

    /// <summary>
    /// Checks if a contract exists
    /// </summary>
    /// <param name="contractId">The GUID of the contract</param>
    /// <returns>True if the contract exists, false otherwise</returns>
    public bool ContractExists(Guid contractId)
    {
        var filePath = Path.Combine(_tempDirectory, $"{contractId}.json");
        return File.Exists(filePath);
    }

    /// <summary>
    /// Clears all contracts from the temp directory (for testing/cleanup)
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public bool ClearAllContracts()
    {
        try
        {
            var files = Directory.GetFiles(_tempDirectory, "*.json");
            foreach (var file in files)
            {
                File.Delete(file);
            }
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error clearing contracts: {ex.Message}");
            return false;
        }
    }
}




