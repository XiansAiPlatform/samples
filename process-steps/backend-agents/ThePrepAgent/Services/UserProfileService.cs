using PowerOfAttorneyAgent.Model;
using PowerOfAttorneyAgent.Repositories;

namespace PowerOfAttorneyAgent.Services;

/// <summary>
/// Service class for fetching user profile information including Principal, Acquaintances, and Assets
/// </summary>
public class UserProfileService
{
    private readonly UserProfileRepository _repository;

    /// <summary>
    /// Initializes a new instance of the UserProfileService
    /// </summary>
    public UserProfileService()
    {
        _repository = new UserProfileRepository();
    }

    /// <summary>
    /// Fetches the Principal information for a given user ID
    /// </summary>
    /// <param name="userId">The GUID of the user</param>
    /// <returns>Principal information if found, null otherwise</returns>
    public Principal? GetPrincipal(Guid userId)
    {
        var principal = _repository.GetPrincipal(userId);
        return principal;
    }

    /// <summary>
    /// Fetches all acquaintances for a given user ID
    /// </summary>
    /// <param name="userId">The GUID of the user</param>
    /// <returns>List of acquaintances</returns>
    public List<Acquaintance> GetAcquaintances(Guid userId)
    {
        var acquaintances = _repository.GetAcquaintances(userId);
        return acquaintances;
    }

    /// <summary>
    /// Fetches all assets for a given user ID
    /// </summary>
    /// <param name="userId">The GUID of the user</param>
    /// <returns>List of assets</returns>
    public List<Asset> GetAssets(Guid userId)
    {
        if (userId == Guid.Empty)
            return new List<Asset>();

        var assets = _repository.GetAssets(userId);
        return assets;

    }

    /// <summary>
    /// Fetches complete user profile including Principal, Acquaintances, and Assets
    /// </summary>
    /// <param name="userId">The GUID of the user</param>
    /// <returns>Tuple containing Principal, Acquaintances, and Assets</returns>
    public (Principal? Principal, List<Acquaintance> Acquaintances, List<Asset> Assets) GetUserProfile(Guid userId)
    {
        if (userId == Guid.Empty)
            return (null, new List<Acquaintance>(), new List<Asset>());

        var principal = GetPrincipal(userId);
        var acquaintances = GetAcquaintances(userId);
        var assets = GetAssets(userId);

        return (principal, acquaintances, assets);

    }

    /// <summary>
    /// Gets a specific acquaintance by ID for a user
    /// </summary>
    /// <param name="acquaintanceId">The GUID of the acquaintance</param>
    /// <returns>Acquaintance if found, null otherwise</returns>
    public Acquaintance? GetAcquaintanceById(Guid userId, Guid acquaintanceId)
    {
        var acquaintance = _repository.GetAcquaintances(userId).FirstOrDefault(a => a.AcquaintanceId == acquaintanceId);
        return acquaintance;
    }

    /// <summary>
    /// Gets a specific asset by ID for a user
    /// </summary>
    /// <param name="userId">The GUID of the user</param>
    /// <param name="assetId">The GUID of the asset</param>
    /// <returns>Asset if found, null otherwise</returns>
    public Asset? GetAssetById(Guid userId, Guid assetId)
    {
        var asset = _repository.GetAssets(userId).FirstOrDefault(a => a.Id == assetId);
        return asset;
    }
}