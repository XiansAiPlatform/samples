using Microsoft.Extensions.AI;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Search;
using OpenAI;
using IndexingAgent.Configuration;
using IndexingAgent.Models;
using XiansAi.Logging;

namespace IndexingAgent.Services;

/// <summary>
/// Service for managing MongoDB vector store operations
/// </summary>
public class MongoVectorStoreService : IDisposable
{
    private readonly VectorStoreConfiguration _configuration;
    private readonly MongoClient _mongoClient;
    private readonly IMongoDatabase _database;
    private readonly IEmbeddingGenerator<string, Embedding<float>> _embeddingGenerator;
    private readonly Logger<MongoVectorStoreService> _logger = Logger<MongoVectorStoreService>.For();
    private bool _disposed = false;

    public MongoVectorStoreService(VectorStoreConfiguration configuration)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _configuration.Validate();

        // Initialize MongoDB client
        _mongoClient = new MongoClient(_configuration.ConnectionString);
        _database = _mongoClient.GetDatabase(_configuration.DatabaseName);

        // Validate Atlas connection
        ValidateAtlasConnection();

        // Create OpenAI embedding generator
        var openAIClient = new OpenAIClient(_configuration.OpenAIApiKey);
        _embeddingGenerator = openAIClient
            .GetEmbeddingClient(_configuration.EmbeddingModel)
            .AsIEmbeddingGenerator();
    }

    /// <summary>
    /// Validates that we're connected to MongoDB Atlas (required for Vector Search)
    /// </summary>
    private void ValidateAtlasConnection()
    {
        try
        {
            var connectionString = _configuration.ConnectionString.ToLowerInvariant();
            
            // Check if connection string indicates Atlas
            var isAtlas = connectionString.Contains("mongodb.net") || 
                         connectionString.Contains("mongodb+srv://") ||
                         connectionString.Contains("atlas");
            
            if (!isAtlas)
            {
                _logger.LogWarning("⚠️ WARNING: Connection string does not appear to be MongoDB Atlas");
                _logger.LogInformation("💡 Vector Search requires MongoDB Atlas. Local MongoDB instances are not supported.");
                _logger.LogInformation("🔗 Get Atlas connection string from: https://cloud.mongodb.com/");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning($"⚠️ Could not validate Atlas connection: {ex.Message}");
        }
    }

    /// <summary>
    /// Ensures the vector search index exists, creating it if necessary
    /// </summary>
    public async Task EnsureVectorSearchIndexAsync(string collectionName, CancellationToken cancellationToken = default)
    {
        try
        {
            var collection = _database.GetCollection<DocumentModel>(collectionName);
            
            _logger.LogInformation($"🔧 Ensuring collection '{collectionName}' exists...");
            
            // Ensure collection exists by inserting and immediately removing a dummy document
            await EnsureCollectionExistsAsync(collection, cancellationToken);
            
            var searchIndexView = collection.SearchIndexes;
            
            _logger.LogInformation($"🔧 Ensuring vector search index '{_configuration.VectorIndexName}' exists...");
            
            // Check if index already exists
            var cursor = await searchIndexView.ListAsync();
            var existingIndexes = await cursor.ToListAsync(cancellationToken);
            var indexExists = existingIndexes.Any(idx => 
                idx.GetValue("name", BsonNull.Value).AsString == _configuration.VectorIndexName);
                
            if (indexExists)
            {
                _logger.LogInformation($"✅ Vector search index '{_configuration.VectorIndexName}' already exists");
                
                // Check if index is queryable
                var targetIndex = existingIndexes.FirstOrDefault(idx => 
                    idx.GetValue("name", BsonNull.Value).AsString == _configuration.VectorIndexName);
                    
                if (targetIndex != null && targetIndex.GetValue("queryable", BsonBoolean.False).AsBoolean)
                {
                    _logger.LogInformation("✅ Index is ready for querying");
                }
                else
                {
                    _logger.LogInformation("⏳ Index is still building, waiting for it to become queryable...");
                    await WaitForIndexReady(searchIndexView, _configuration.VectorIndexName, cancellationToken);
                }
                return;
            }

            // Create index using modern driver API
            var indexName = _configuration.VectorIndexName;
            var type = SearchIndexType.VectorSearch;
            
            var fields = new BsonArray
            {
                // Vector field
                new BsonDocument
                {
                    { "type", "vector" },
                    { "path", "Embedding" },
                    { "numDimensions", _configuration.EmbeddingDimensions },
                    { "similarity", _configuration.SimilarityFunction }
                }
            };

            // Add quantization if not 'none'
            if (_configuration.Quantization != "none")
            {
                ((BsonDocument)fields[0])["quantization"] = _configuration.Quantization;
            }

            // Add filter fields
            foreach (var filterField in _configuration.FilterFields)
            {
                fields.Add(new BsonDocument
                {
                    { "type", "filter" },
                    { "path", filterField }
                });
            }

            var definition = new BsonDocument
            {
                { "fields", fields }
            };

            var model = new CreateSearchIndexModel(indexName, type, definition);
            var result = await searchIndexView.CreateOneAsync(model, cancellationToken);
            
            _logger.LogInformation($"✅ Created vector search index: {result}");
            
            // Wait for index to become queryable
            await WaitForIndexReady(searchIndexView, indexName, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning($"⚠️ Failed to ensure vector search index: {ex.Message}");
            
            // Check if this is an Atlas-specific error
            if (ex.Message.Contains("Atlas Search Database Commands") || 
                ex.Message.Contains("additional configuration") ||
                ex.Message.Contains("AtlasCLI local deployment"))
            {
                _logger.LogError("🚨 ATLAS CONNECTION ISSUE DETECTED:");
                _logger.LogError("❌ You are not connected to MongoDB Atlas or Atlas Search is not enabled");
                _logger.LogError("");
                _logger.LogError("🔧 TO FIX THIS ISSUE:");
                _logger.LogError("1. Ensure you're using a MongoDB Atlas connection string (not local MongoDB)");
                _logger.LogError("2. Your connection string should look like: mongodb+srv://username:password@cluster.mongodb.net/database");
                _logger.LogError("3. Create a .env file based on .env.template with your Atlas credentials");
                _logger.LogError("4. Ensure your Atlas cluster has Vector Search enabled");
                _logger.LogError("5. Get your Atlas connection string from: https://cloud.mongodb.com/");
                _logger.LogError("");
                _logger.LogError("📖 For more info: https://dochub.mongodb.org/core/atlas-cli-deploy-local-reqs");
            }
            else if (ex.Message.Contains("does not exist"))
            {
                _logger.LogInformation("📝 Collection creation issue detected");
                _logger.LogInformation("💡 The collection will be created automatically when documents are indexed");
                _logger.LogInformation("🔄 Retrying index creation after collection setup...");
                
                // Don't throw here - let the application continue and create the collection during document insertion
                return;
            }
            else
            {
                _logger.LogWarning("Vector search may not work until the index is manually created in Atlas");
                _logger.LogInformation($"💡 You can create the index manually in Atlas with the name '{_configuration.VectorIndexName}' on the 'Embedding' field");
            }
            
            throw;
        }
    }

    /// <summary>
    /// Ensures the collection exists by creating it if necessary
    /// </summary>
    private async Task EnsureCollectionExistsAsync(IMongoCollection<DocumentModel> collection, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if collection exists by trying to get its stats
            var collectionName = collection.CollectionNamespace.CollectionName;
            var databaseName = collection.Database.DatabaseNamespace.DatabaseName;
            
            // List collections to check if it exists
            var collections = await collection.Database.ListCollectionNamesAsync();
            var collectionExists = await collections.ToListAsync(cancellationToken);
            
            if (collectionExists.Contains(collectionName))
            {
                _logger.LogInformation($"✅ Collection '{databaseName}.{collectionName}' already exists");
                return;
            }
            
            _logger.LogInformation($"📝 Creating collection '{databaseName}.{collectionName}'...");
            
            // Create collection by inserting and immediately removing a dummy document
            var dummyDoc = new DocumentModel
            {
                Key = "_dummy_document_for_collection_creation",
                Text = "This is a temporary document to create the collection",
                Embedding = new float[_configuration.EmbeddingDimensions], // Empty embedding array
                Source = "system",
                Category = "temporary",
                IndexedAt = DateTime.UtcNow
            };
            
            // Insert dummy document
            await collection.InsertOneAsync(dummyDoc, cancellationToken: cancellationToken);
            
            // Immediately remove it
            await collection.DeleteOneAsync(d => d.Key == "_dummy_document_for_collection_creation", cancellationToken);
            
            _logger.LogInformation($"✅ Collection '{databaseName}.{collectionName}' created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning($"⚠️ Error ensuring collection exists: {ex.Message}");
            // Don't throw here - the collection might be created during the actual document insertion
        }
    }

    /// <summary>
    /// Waits for the search index to become queryable
    /// </summary>
    private async Task WaitForIndexReady(IMongoSearchIndexManager searchIndexView, string indexName, CancellationToken cancellationToken)
    {
        _logger.LogInformation($"⏳ Waiting for index '{indexName}' to become queryable...");
        
        var timeout = TimeSpan.FromMinutes(_configuration.IndexCreationTimeoutMinutes);
        var startTime = DateTime.UtcNow;
        
        while (DateTime.UtcNow - startTime < timeout)
        {
            cancellationToken.ThrowIfCancellationRequested();
            
            try
            {
                var cursor = await searchIndexView.ListAsync();
                var indexes = await cursor.ToListAsync(cancellationToken);
                var targetIndex = indexes.FirstOrDefault(idx => 
                    idx.GetValue("name", BsonNull.Value).AsString == indexName);
                    
                if (targetIndex != null)
                {
                    var status = targetIndex.GetValue("status", BsonNull.Value).AsString;
                    var queryable = targetIndex.GetValue("queryable", BsonBoolean.False).AsBoolean;
                    
                    _logger.LogInformation($"📊 Index status: {status}, Queryable: {queryable}");
                    
                    if (status == "FAILED")
                    {
                        throw new InvalidOperationException($"Search index creation failed. Status: {status}");
                    }
                    
                    if (queryable)
                    {
                        _logger.LogInformation($"✅ Index '{indexName}' is ready for querying");
                        return;
                    }
                }
                
                await Task.Delay(5000, cancellationToken); // Check every 5 seconds
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"⚠️ Error checking index status: {ex.Message}");
                await Task.Delay(5000, cancellationToken);
            }
        }
        
        _logger.LogWarning($"⚠️ Index creation timeout after {timeout.TotalMinutes} minutes");
        _logger.LogInformation("💡 Index may still be building. Vector search might not work immediately.");
    }

    /// <summary>
    /// Indexes a batch of documents
    /// </summary>
    public async Task<IndexingResult> IndexDocumentsAsync(
        IndexingRequest request, 
        CancellationToken cancellationToken = default)
    {
        if (request?.Documents == null || !request.Documents.Any())
            return new IndexingResult { Success = false, Message = "No documents to index" };

        var result = new IndexingResult { Success = true };
        var processedCount = 0;
        var skippedCount = 0;
        var errors = new List<string>();

        try
        {
            // Get MongoDB collection
            var collection = _database.GetCollection<DocumentModel>(request.CollectionName);

            // Filter out documents that already exist (unless overwrite is enabled)
            var documentsToProcess = request.Documents;
            if (!request.OverwriteExisting)
            {
                var documentKeys = request.Documents
                    .Where(d => !string.IsNullOrEmpty(d.Key))
                    .Select(d => d.Key!)
                    .ToList();

                if (documentKeys.Any())
                {
                    var existingKeys = await GetExistingDocumentKeysAsync(request.CollectionName, documentKeys, cancellationToken);
                    documentsToProcess = request.Documents
                        .Where(d => string.IsNullOrEmpty(d.Key) || !existingKeys.Contains(d.Key))
                        .ToList();
                    
                    skippedCount = request.Documents.Count - documentsToProcess.Count;
                    
                    if (skippedCount > 0)
                    {
                        _logger.LogInformation($"⏭️ Skipping {skippedCount} documents that already exist");
                    }
                }
            }

            if (!documentsToProcess.Any())
            {
                return new IndexingResult 
                { 
                    Success = true, 
                    Message = $"All {request.Documents.Count} documents already exist and were skipped",
                    ProcessedCount = 0,
                    SkippedCount = skippedCount
                };
            }

            // Process documents in batches
            var batches = documentsToProcess
                .Select((doc, index) => new { doc, index })
                .GroupBy(x => x.index / request.BatchSize)
                .Select(g => g.Select(x => x.doc).ToList());

            foreach (var batch in batches)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    var documentModels = await CreateDocumentModelsAsync(batch, cancellationToken);
                    
                    if (request.OverwriteExisting)
                    {
                        var bulkOps = documentModels.Select(doc => 
                            new ReplaceOneModel<DocumentModel>(
                                Builders<DocumentModel>.Filter.Eq(d => d.Key, doc.Key), doc)
                            { IsUpsert = true });
                        
                        await collection.BulkWriteAsync(bulkOps, cancellationToken: cancellationToken);
                    }
                    else
                    {
                        await collection.InsertManyAsync(documentModels, cancellationToken: cancellationToken);
                    }

                    processedCount += batch.Count;
                }
                catch (Exception ex)
                {
                    errors.Add($"Batch processing error: {ex.Message}");
                    result.Success = false;
                }
            }

            result.ProcessedCount = processedCount;
            result.SkippedCount = skippedCount;
            result.Message = errors.Any() 
                ? $"Processed {processedCount} documents with {errors.Count} errors" + (skippedCount > 0 ? $", skipped {skippedCount} existing documents" : "")
                : $"Successfully processed {processedCount} documents" + (skippedCount > 0 ? $", skipped {skippedCount} existing documents" : "");
            result.Errors = errors;

            // If we processed documents successfully, try to ensure the vector search index exists
            if (processedCount > 0 && result.Success)
            {
                try
                {
                    _logger.LogInformation("🔄 Attempting to create vector search index after document insertion...");
                    await EnsureVectorSearchIndexAsync(request.CollectionName, cancellationToken);
                }
                catch (Exception indexEx)
                {
                    _logger.LogWarning($"⚠️ Could not create vector search index after document insertion: {indexEx.Message}");
                    _logger.LogInformation("💡 You may need to create the index manually in Atlas");
                }
            }
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Message = $"Indexing failed: {ex.Message}";
            result.Errors = new List<string> { ex.ToString() };
        }

        return result;
    }

    /// <summary>
    /// Searches for similar documents using vector search
    /// </summary>
    public async Task<List<DocumentModel>> SearchSimilarAsync(
        string query, 
        string collectionName,
        int limit = 10,
        Dictionary<string, object>? filters = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var collection = _database.GetCollection<DocumentModel>(collectionName);
            
            // Generate embedding for the query
            var queryEmbedding = await _embeddingGenerator.GenerateAsync([query]);
            var searchVector = queryEmbedding.First().Vector.ToArray();

            // Build vector search document
            var vectorSearchDoc = new BsonDocument
            {
                ["index"] = _configuration.VectorIndexName,
                ["path"] = "Embedding",
                ["queryVector"] = new BsonArray(searchVector),
                ["numCandidates"] = limit * 10,
                ["limit"] = limit
            };

            // Add filters if provided
            if (filters != null && filters.Any())
            {
                var filterDoc = new BsonDocument();
                foreach (var filter in filters)
                {
                    filterDoc[filter.Key] = BsonValue.Create(filter.Value);
                }
                vectorSearchDoc["filter"] = filterDoc;
                
                _logger.LogInformation($"🔍 Applying filters: {string.Join(", ", filters.Select(f => $"{f.Key}={f.Value}"))}");
            }

            // Perform vector search using MongoDB Atlas Vector Search
            var pipeline = new[] { new BsonDocument("$vectorSearch", vectorSearchDoc) };
            var results = await collection.Aggregate<DocumentModel>(pipeline).ToListAsync(cancellationToken);
            
            if (results.Any())
            {
                _logger.LogInformation($"🔍 Found {results.Count} similar documents using vector search");
            }
            else
            {
                _logger.LogInformation("🔍 No similar documents found");
            }
            
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Vector search failed: {ex.Message}");
            
            if (ex.Message.Contains("$search") || ex.Message.Contains("$vectorSearch") || 
                ex.Message.Contains("additional configuration") || ex.Message.Contains("AtlasCLI"))
            {
                _logger.LogError("🚨 ATLAS VECTOR SEARCH NOT AVAILABLE:");
                _logger.LogError("❌ You must be connected to MongoDB Atlas to use Vector Search");
                _logger.LogInformation("💡 Check your connection string and ensure it points to Atlas (mongodb+srv://...)");
            }
            else if (ex.Message.Contains("index") || ex.Message.Contains("Index"))
            {
                _logger.LogInformation("💡 Tip: Vector search index may still be building. This can take a few minutes after creation.");
            }
            
            return new List<DocumentModel>();
        }
    }

    /// <summary>
    /// Searches for similar documents using vector search (overload without filters for backward compatibility)
    /// </summary>
    public async Task<List<DocumentModel>> SearchSimilarAsync(
        string query, 
        string collectionName,
        int limit = 10,
        CancellationToken cancellationToken = default)
    {
        return await SearchSimilarAsync(query, collectionName, limit, null, cancellationToken);
    }

    /// <summary>
    /// Checks if documents with the given keys already exist in the collection
    /// </summary>
    public async Task<HashSet<string>> GetExistingDocumentKeysAsync(
        string collectionName,
        IEnumerable<string> keys,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var collection = _database.GetCollection<DocumentModel>(collectionName);
            var filter = Builders<DocumentModel>.Filter.In(d => d.Key, keys);
            var projection = Builders<DocumentModel>.Projection.Include(d => d.Key);
            
            var existingDocs = await collection
                .Find(filter)
                .Project<BsonDocument>(projection)
                .ToListAsync(cancellationToken);
            
            return existingDocs.Select(doc => doc["Key"].AsString).ToHashSet();
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error checking existing documents: {ex.Message}");
            return new HashSet<string>();
        }
    }

    /// <summary>
    /// Gets collection statistics
    /// </summary>
    public async Task<CollectionStats> GetCollectionStatsAsync(
        string collectionName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var database = _mongoClient.GetDatabase(_configuration.DatabaseName);
            var collection = database.GetCollection<DocumentModel>(collectionName);
            
            var count = await collection.CountDocumentsAsync(FilterDefinition<DocumentModel>.Empty, cancellationToken: cancellationToken);
            
            return new CollectionStats
            {
                CollectionName = collectionName,
                DocumentCount = count,
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            return new CollectionStats
            {
                CollectionName = collectionName,
                DocumentCount = 0,
                Error = ex.Message
            };
        }
    }

    /// <summary>
    /// Creates DocumentModel instances from DocumentToIndex instances
    /// </summary>
    private async Task<List<DocumentModel>> CreateDocumentModelsAsync(
        List<DocumentToIndex> documents,
        CancellationToken cancellationToken = default)
    {
        var documentModels = new List<DocumentModel>();
        
        // First, chunk documents that are too large
        var optimalChunkSize = TextChunkingService.GetOptimalChunkSize(_configuration.EmbeddingModel);
        var overlapSize = TextChunkingService.GetOptimalOverlapSize(optimalChunkSize);
        var chunkedDocuments = TextChunkingService.ChunkDocuments(documents, optimalChunkSize, overlapSize);
        
        _logger.LogInformation($"📄 Processing {chunkedDocuments.Count} document chunks for embedding generation");
        
        // Process each chunk individually to avoid token limit issues
        foreach (var doc in chunkedDocuments)
        {
            try
            {
                // Generate embedding for the document/chunk
                var embeddings = await _embeddingGenerator.GenerateAsync([doc.Text]);
                var embedding = embeddings.First();
                
                documentModels.Add(new DocumentModel
                {
                    Key = doc.Key ?? ObjectId.GenerateNewId().ToString(),
                    Text = doc.Text,
                    Embedding = embedding.Vector,
                    Source = doc.Source,
                    Category = doc.Category,
                    Metadata = doc.Metadata,
                    IndexedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"⚠️ Failed to generate embedding for document '{doc.Key}': {ex.Message}");
                // Skip this document rather than failing the entire batch
                continue;
            }
        }
        
        return documentModels;
    }



    /// <summary>
    /// Lists all search indexes for a collection
    /// </summary>
    public async Task<List<BsonDocument>> ListSearchIndexesAsync(string collectionName, CancellationToken cancellationToken = default)
    {
        try
        {
            var collection = _database.GetCollection<DocumentModel>(collectionName);
            var cursor = await collection.SearchIndexes.ListAsync();
            return await cursor.ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Failed to list search indexes: {ex.Message}");
            return new List<BsonDocument>();
        }
    }

    /// <summary>
    /// Updates an existing search index (Note: Update functionality may require dropping and recreating the index)
    /// </summary>
    public Task UpdateSearchIndexAsync(string collectionName, string indexName, BsonDocument definition, CancellationToken cancellationToken = default)
    {
        try
        {
            var collection = _database.GetCollection<DocumentModel>(collectionName);
            
            // Note: MongoDB C# driver may not have direct update method for search indexes
            // This is a placeholder implementation - in practice, you might need to drop and recreate
            _logger.LogWarning("⚠️ Index update not directly supported in current driver version");
            _logger.LogInformation("💡 Consider dropping and recreating the index with new definition");
            
            throw new NotSupportedException("Direct index update is not supported in the current MongoDB C# driver version. Please drop and recreate the index.");
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Failed to update search index '{indexName}': {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Deletes a search index
    /// </summary>
    public async Task DeleteSearchIndexAsync(string collectionName, string indexName, CancellationToken cancellationToken = default)
    {
        try
        {
            var collection = _database.GetCollection<DocumentModel>(collectionName);
            await collection.SearchIndexes.DropOneAsync(indexName, cancellationToken);
            _logger.LogInformation($"✅ Deleted search index '{indexName}' successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Failed to delete search index '{indexName}': {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Gets detailed information about a specific search index
    /// </summary>
    public async Task<BsonDocument?> GetSearchIndexAsync(string collectionName, string indexName, CancellationToken cancellationToken = default)
    {
        try
        {
            var indexes = await ListSearchIndexesAsync(collectionName, cancellationToken);
            return indexes.FirstOrDefault(idx => 
                idx.GetValue("name", BsonNull.Value).AsString == indexName);
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Failed to get search index '{indexName}': {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Checks if a search index exists and is queryable
    /// </summary>
    public async Task<bool> IsIndexReadyAsync(string collectionName, string indexName, CancellationToken cancellationToken = default)
    {
        try
        {
            var index = await GetSearchIndexAsync(collectionName, indexName, cancellationToken);
            return index != null && index.GetValue("queryable", BsonBoolean.False).AsBoolean;
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Failed to check index readiness for '{indexName}': {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Gets comprehensive index statistics and status
    /// </summary>
    public async Task<IndexStats> GetIndexStatsAsync(string collectionName, string indexName, CancellationToken cancellationToken = default)
    {
        try
        {
            var index = await GetSearchIndexAsync(collectionName, indexName, cancellationToken);
            if (index == null)
            {
                return new IndexStats
                {
                    IndexName = indexName,
                    CollectionName = collectionName,
                    Exists = false,
                    Status = "NOT_FOUND",
                    Queryable = false,
                    LastUpdated = DateTime.UtcNow
                };
            }

            return new IndexStats
            {
                IndexName = indexName,
                CollectionName = collectionName,
                Exists = true,
                Status = index.GetValue("status", BsonNull.Value).AsString ?? "UNKNOWN",
                Queryable = index.GetValue("queryable", BsonBoolean.False).AsBoolean,
                Type = index.GetValue("type", BsonNull.Value).AsString ?? "UNKNOWN",
                Definition = index.GetValue("latestDefinition", new BsonDocument()).AsBsonDocument,
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            return new IndexStats
            {
                IndexName = indexName,
                CollectionName = collectionName,
                Exists = false,
                Status = "ERROR",
                Queryable = false,
                Error = ex.Message,
                LastUpdated = DateTime.UtcNow
            };
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            // MongoClient doesn't implement IDisposable in newer versions
            _disposed = true;
        }
    }
}

/// <summary>
/// Result of an indexing operation
/// </summary>
public class IndexingResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int ProcessedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}

/// <summary>
/// Statistics about a collection
/// </summary>
public class CollectionStats
{
    public required string CollectionName { get; init; }
    public long DocumentCount { get; init; }
    public DateTime LastUpdated { get; init; }
    public string? Error { get; init; }
}

/// <summary>
/// Statistics and information about a search index
/// </summary>
public class IndexStats
{
    public required string IndexName { get; init; }
    public required string CollectionName { get; init; }
    public bool Exists { get; init; }
    public required string Status { get; init; }
    public bool Queryable { get; init; }
    public string? Type { get; init; }
    public BsonDocument? Definition { get; init; }
    public DateTime LastUpdated { get; init; }
    public string? Error { get; init; }
}
