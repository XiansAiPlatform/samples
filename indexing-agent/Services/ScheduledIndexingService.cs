using IndexingAgent.Configuration;
using IndexingAgent.Models;
using XiansAi.Logging;

namespace IndexingAgent.Services;

/// <summary>
/// Service for handling scheduled indexing operations
/// </summary>
public class ScheduledIndexingService : IDisposable
{
    private readonly MongoVectorStoreService _vectorStoreService;
    private readonly VectorStoreConfiguration _configuration;
    private bool _disposed = false;

    private readonly Logger<ScheduledIndexingService> _logger = Logger<ScheduledIndexingService>.For();

    public ScheduledIndexingService(VectorStoreConfiguration configuration)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _vectorStoreService = new MongoVectorStoreService(configuration);
    }

    /// <summary>
    /// Processes a scheduled indexing job
    /// </summary>
    public async Task ProcessScheduledIndexingAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting scheduled indexing process...");

            // Get sample documents to index (in a real scenario, this would come from a queue, file system, API, etc.)
            var documentsToIndex = await GetDocumentsToIndexAsync(cancellationToken);

            if (!documentsToIndex.Any())
            {
                _logger.LogInformation("No documents to index.");
                return;
            }

            _logger.LogInformation("Found documents to index . Count: " + documentsToIndex.Count);

            // Ensure vector search index exists
            await _vectorStoreService.EnsureVectorSearchIndexAsync(_configuration.DefaultCollectionName, cancellationToken);

            // Create indexing request
            var indexingRequest = new IndexingRequest
            {
                Documents = documentsToIndex,
                CollectionName = _configuration.DefaultCollectionName,
                OverwriteExisting = false, // Skip documents that already exist
                BatchSize = Math.Min(documentsToIndex.Count, _configuration.MaxBatchSize)
            };

            // Process the indexing
            var result = await _vectorStoreService.IndexDocumentsAsync(indexingRequest, cancellationToken);

            // Log results
            if (result.Success)
            {
                _logger.LogInformation("✅ " + result.Message);
                
                // Get collection statistics
                var stats = await _vectorStoreService.GetCollectionStatsAsync(
                    _configuration.DefaultCollectionName, 
                    cancellationToken);
                
                _logger.LogInformation("Collection '" + stats.CollectionName + "' now contains " + stats.DocumentCount + " documents.");
            }
            else
            {
                _logger.LogError("❌ Indexing failed: " + result.Message);
                
                if (result.Errors.Any())
                {
                    _logger.LogError("Errors:");
                    foreach (var error in result.Errors)
                    {
                        _logger.LogError("  - " + error);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError("❌ Scheduled indexing failed: " + ex.Message);
            _logger.LogError("Stack trace: " + ex.StackTrace);
        }
    }

    /// <summary>
    /// Performs a test search to verify the indexing is working
    /// </summary>
    public async Task PerformTestSearchAsync(string query = "developer", CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation($"Performing test search for: '{query}'");

            var results = await _vectorStoreService.SearchSimilarAsync(
                query, 
                _configuration.DefaultCollectionName, 
                limit: 5, 
                cancellationToken);

            if (results.Any())
            {
                _logger.LogInformation($"Found {results.Count} similar documents:");
                
                for (int i = 0; i < results.Count; i++)
                {
                    var doc = results[i];
                    _logger.LogInformation($"  {i + 1}. Has {doc.Text.Length} characters");
                    if (!string.IsNullOrEmpty(doc.Source))
                        _logger.LogInformation($"     Source: {doc.Source}");
                    if (!string.IsNullOrEmpty(doc.Category))
                        _logger.LogInformation($"     Category: {doc.Category}");
                }
            }
            else
            {
                _logger.LogInformation($"No similar documents found for query: '{query}'");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Test search failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Gets documents to index from various online sources
    /// </summary>
    private async Task<List<DocumentToIndex>> GetDocumentsToIndexAsync(CancellationToken cancellationToken = default)
    {
        var allDocuments = new List<DocumentToIndex>();

        try
        {
            // Use RSS feeds as the working source (no API keys required)
            using var rssService = new RssFeedService();

            _logger.LogInformation("📰 Fetching from RSS feeds...");
            var rssFeeds = RssFeedService.GetRecommendedFeeds().ToList();
            var rssDocuments = await rssService.GetNewDocumentsAsync(rssFeeds, cancellationToken);
            allDocuments.AddRange(rssDocuments); // Process all retrieved articles

            // Add batch metadata
            var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
            foreach (var doc in allDocuments)
            {
                doc.Metadata ??= new Dictionary<string, object>();
                doc.Metadata["indexed_batch"] = timestamp;
                doc.Metadata["source_type"] = "rss_feeds";
            }

            _logger.LogInformation($"✅ Retrieved {allDocuments.Count} documents from online sources");
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Error fetching online documents: {ex.Message}");
            _logger.LogInformation("Using fallback documents...");
        }

        return allDocuments;
    }

    /// <summary>
    /// Cleans up old or outdated documents
    /// </summary>
    public async Task CleanupOldDocumentsAsync(TimeSpan maxAge, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation($"Starting cleanup of documents older than {maxAge.TotalDays:F1} days...");
            
            // Simulate async cleanup operation
            await Task.Delay(100, cancellationToken);
            
            // In a real implementation, you would:
            // 1. Query for documents older than maxAge
            // 2. Delete them from the vector store
            // 3. Log the cleanup results
            
            // For now, just log that cleanup would happen
            _logger.LogInformation("Cleanup completed (simulated).");
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Cleanup failed: {ex.Message}");
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _vectorStoreService?.Dispose();
            _disposed = true;
        }
    }
}
