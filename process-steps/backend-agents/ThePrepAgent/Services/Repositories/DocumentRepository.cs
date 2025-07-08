using Microsoft.Extensions.Logging;
using PowerOfAttorneyAgent.Model;
using System.Text.Json;

namespace PowerOfAttorneyAgent.Repositories;

/// <summary>
/// Repository class for managing Power of Attorney documents with filesystem storage
/// </summary>
public class DocumentRepository
{
    private static readonly ILogger<DocumentRepository> _logger = new LoggerFactory().CreateLogger<DocumentRepository>();
    private readonly string _dbFolderPath;

    public DocumentRepository()
    {
        _dbFolderPath = Path.Combine(Directory.GetCurrentDirectory(),"Services", "Repositories", "db");
        EnsureDbFolderExists();
    }

    /// <summary>
    /// Ensures the db folder exists
    /// </summary>
    private void EnsureDbFolderExists()
    {
        if (!Directory.Exists(_dbFolderPath))
        {
            Directory.CreateDirectory(_dbFolderPath);
            _logger.LogInformation($"Created database folder: {_dbFolderPath}");
        }
    }

    /// <summary>
    /// Gets the file path for a document
    /// </summary>
    /// <param name="documentId">The document ID</param>
    /// <returns>The full file path</returns>
    private string GetDocumentFilePath(Guid documentId)
    {
        return Path.Combine(_dbFolderPath, $"{documentId}.json");
    }

    /// <summary>
    /// Gets a Power of Attorney document from the filesystem, creating a new one if it doesn't exist
    /// </summary>
    /// <param name="documentId">The ID of the document</param>
    /// <returns>The document if found, or a newly created document</returns>
    public async Task<PowerOfAttorney?> GetDocument(Guid documentId)
    {
        return await GetOrCreateDocument(documentId);
    }

    /// <summary>
    /// Gets a Power of Attorney document by ID, creating a new one if it doesn't exist
    /// </summary>
    /// <param name="documentId">The ID of the document</param>
    /// <returns>The existing or newly created document</returns>
    private async Task<PowerOfAttorney> GetOrCreateDocument( Guid documentId)
    {
        var filePath = GetDocumentFilePath(documentId);

        if (File.Exists(filePath))
        {
            try
            {
                var json = await File.ReadAllTextAsync(filePath);
                var document = JsonSerializer.Deserialize<PowerOfAttorney>(json);
                if (document != null)
                {
                    _logger.LogInformation($"Document loaded from file: {documentId}");
                    return document;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error loading document {documentId}: {ex.Message}");
            }
        }

        // Create a new document if it doesn't exist or failed to load
        _logger.LogInformation($"Creating new document: {documentId}");
        var newDocument = CreateNewDocument();
        SaveDocument(documentId, newDocument);
        return newDocument;
    }

    /// <summary>
    /// Adds a Power of Attorney document to the filesystem storage
    /// </summary>
    /// <param name="documentId">The unique ID for the document</param>
    /// <param name="document">The document to add</param>
    /// <returns>True if added successfully, false if document ID already exists</returns>
    public bool AddDocument(Guid documentId, PowerOfAttorney document)
    {
        var filePath = GetDocumentFilePath(documentId);
        
        if (File.Exists(filePath))
        {
            _logger.LogWarning($"Document {documentId} already exists");
            return false;
        }

        return SaveDocument(documentId, document);
    }

    /// <summary>
    /// Removes a Power of Attorney document from the filesystem storage
    /// </summary>
    /// <param name="documentId">The ID of the document to remove</param>
    /// <returns>True if removed successfully, false if not found</returns>
    public bool RemoveDocument(Guid documentId)
    {
        var filePath = GetDocumentFilePath(documentId);
        
        if (!File.Exists(filePath))
        {
            _logger.LogWarning($"Document {documentId} not found for removal");
            return false;
        }

        try
        {
            File.Delete(filePath);
            _logger.LogInformation($"Document {documentId} removed successfully");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error removing document {documentId}: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Saves a document to the filesystem
    /// </summary>
    /// <param name="documentId">The document ID</param>
    /// <param name="document">The document to save</param>
    /// <returns>True if saved successfully, false otherwise</returns>
    public bool SaveDocument(Guid documentId, PowerOfAttorney document)
    {
        var filePath = GetDocumentFilePath(documentId);
        
        try
        {
            var json = JsonSerializer.Serialize(document, new JsonSerializerOptions 
            { 
                WriteIndented = true 
            });
            File.WriteAllText(filePath, json);
            _logger.LogInformation($"Document {documentId} saved successfully to {filePath}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error saving document {documentId}: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Creates a new empty Power of Attorney document with default values
    /// </summary>
    /// <returns>New Power of Attorney document</returns>
    private PowerOfAttorney CreateNewDocument()
    {
        var userId = Guid.NewGuid();
        return new PowerOfAttorney
            {
                Principal = new UserProfileRepository().GetPrincipal(userId),
                Scope = "Property and financial matters",
                Representatives = new List<Representative>(),
                Conditions = new List<Condition>(),
                Witnesses = new List<Witness>()
            };
    }
} 