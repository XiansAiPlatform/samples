namespace IndexingAgent.Configuration;

/// <summary>
/// Configuration settings for the vector store
/// </summary>
public class VectorStoreConfiguration
{
    /// <summary>
    /// MongoDB Atlas connection string
    /// </summary>
    public required string ConnectionString { get; init; }

    /// <summary>
    /// Database name for storing vector data
    /// </summary>
    public string DatabaseName { get; init; } = DefaultDatabaseName;

    /// <summary>
    /// Default collection name for documents
    /// </summary>
    public string DefaultCollectionName { get; init; } = DefaultCollectionNameValue;

    /// <summary>
    /// Vector index name
    /// </summary>
    public string VectorIndexName { get; init; } = DefaultVectorIndexName;

    /// <summary>
    /// OpenAI API key for embedding generation
    /// </summary>
    public required string OpenAIApiKey { get; init; }

    /// <summary>
    /// OpenAI embedding model name
    /// </summary>
    public string EmbeddingModel { get; init; } = DefaultEmbeddingModel;

    /// <summary>
    /// Number of dimensions for the embedding model
    /// </summary>
    public int EmbeddingDimensions { get; init; } = DefaultEmbeddingDimensions;

    /// <summary>
    /// Similarity function for vector search (cosine, euclidean, dotProduct)
    /// </summary>
    public string SimilarityFunction { get; init; } = DefaultSimilarityFunction;

    /// <summary>
    /// Vector quantization method (none, scalar, binary)
    /// </summary>
    public string Quantization { get; init; } = DefaultQuantization;

    /// <summary>
    /// Filter fields for pre-filtering vector search results
    /// </summary>
    public List<string> FilterFields { get; init; } = new();

    /// <summary>
    /// Timeout for index creation operations in minutes
    /// </summary>
    public int IndexCreationTimeoutMinutes { get; init; } = DefaultIndexCreationTimeoutMinutes;

    // Default values constants
    private const string DefaultDatabaseName = "rag_db";
    private const string DefaultCollectionNameValue = "documents";
    private const string DefaultVectorIndexName = "vector_index";
    private const string DefaultEmbeddingModel = "text-embedding-ada-002";
    private const int DefaultEmbeddingDimensions = 1536; // text-embedding-ada-002 dimensions
    private const string DefaultSimilarityFunction = "cosine";
    private const string DefaultQuantization = "none";
    private const int DefaultIndexCreationTimeoutMinutes = 5;

    /// <summary>
    /// Maximum batch size for processing documents
    /// </summary>
    public int MaxBatchSize { get; init; } = 100;

    /// <summary>
    /// Timeout for database operations in seconds
    /// </summary>
    public int OperationTimeoutSeconds { get; init; } = 30;

    /// <summary>
    /// Whether to create collections if they don't exist
    /// </summary>
    public bool CreateCollectionIfNotExists { get; init; } = true;

    /// <summary>
    /// Validates the configuration
    /// </summary>
    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(ConnectionString))
            throw new ArgumentException("ConnectionString is required", nameof(ConnectionString));

        if (string.IsNullOrWhiteSpace(OpenAIApiKey))
            throw new ArgumentException("OpenAIApiKey is required", nameof(OpenAIApiKey));

        if (string.IsNullOrWhiteSpace(DatabaseName))
            throw new ArgumentException("DatabaseName cannot be empty", nameof(DatabaseName));

        if (string.IsNullOrWhiteSpace(DefaultCollectionName))
            throw new ArgumentException("DefaultCollectionName cannot be empty", nameof(DefaultCollectionName));

        if (MaxBatchSize <= 0)
            throw new ArgumentException("MaxBatchSize must be greater than 0", nameof(MaxBatchSize));

        if (OperationTimeoutSeconds <= 0)
            throw new ArgumentException("OperationTimeoutSeconds must be greater than 0", nameof(OperationTimeoutSeconds));

        if (EmbeddingDimensions <= 0)
            throw new ArgumentException("EmbeddingDimensions must be greater than 0", nameof(EmbeddingDimensions));

        if (string.IsNullOrWhiteSpace(SimilarityFunction))
            throw new ArgumentException("SimilarityFunction cannot be empty", nameof(SimilarityFunction));

        var validSimilarityFunctions = new[] { "cosine", "euclidean", "dotProduct" };
        if (!validSimilarityFunctions.Contains(SimilarityFunction))
            throw new ArgumentException($"SimilarityFunction must be one of: {string.Join(", ", validSimilarityFunctions)}", nameof(SimilarityFunction));

        var validQuantizations = new[] { "none", "scalar", "binary" };
        if (!validQuantizations.Contains(Quantization))
            throw new ArgumentException($"Quantization must be one of: {string.Join(", ", validQuantizations)}", nameof(Quantization));

        if (IndexCreationTimeoutMinutes <= 0)
            throw new ArgumentException("IndexCreationTimeoutMinutes must be greater than 0", nameof(IndexCreationTimeoutMinutes));
    }

    /// <summary>
    /// Creates configuration from environment variables
    /// </summary>
    public static VectorStoreConfiguration FromEnvironment()
    {
        var connectionString = Environment.GetEnvironmentVariable("ATLAS_CONNECTION_STRING");
        var openAIKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ATLAS_CONNECTION_STRING environment variable is required");

        if (string.IsNullOrWhiteSpace(openAIKey))
            throw new InvalidOperationException("OPENAI_API_KEY environment variable is required");

        var config = new VectorStoreConfiguration
        {
            ConnectionString = connectionString,
            OpenAIApiKey = openAIKey,
            DatabaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE") ?? DefaultDatabaseName,
            DefaultCollectionName = Environment.GetEnvironmentVariable("MONGODB_COLLECTION") ?? DefaultCollectionNameValue,
            VectorIndexName = Environment.GetEnvironmentVariable("VECTOR_INDEX_NAME") ?? DefaultVectorIndexName,
            EmbeddingModel = Environment.GetEnvironmentVariable("EMBEDDING_MODEL") ?? DefaultEmbeddingModel,
            EmbeddingDimensions = int.TryParse(Environment.GetEnvironmentVariable("EMBEDDING_DIMENSIONS"), out var dims) ? dims : DefaultEmbeddingDimensions,
            SimilarityFunction = Environment.GetEnvironmentVariable("SIMILARITY_FUNCTION") ?? DefaultSimilarityFunction,
            Quantization = Environment.GetEnvironmentVariable("QUANTIZATION") ?? DefaultQuantization,
            FilterFields = Environment.GetEnvironmentVariable("FILTER_FIELDS")?.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList() ?? new List<string>()
        };

        // Parse optional integer settings
        if (int.TryParse(Environment.GetEnvironmentVariable("MAX_BATCH_SIZE"), out var batchSize))
        {
            config = new VectorStoreConfiguration
            {
                ConnectionString = config.ConnectionString,
                OpenAIApiKey = config.OpenAIApiKey,
                DatabaseName = config.DatabaseName,
                DefaultCollectionName = config.DefaultCollectionName,
                VectorIndexName = config.VectorIndexName,
                EmbeddingModel = config.EmbeddingModel,
                MaxBatchSize = batchSize,
                OperationTimeoutSeconds = config.OperationTimeoutSeconds,
                CreateCollectionIfNotExists = config.CreateCollectionIfNotExists
            };
        }

        if (int.TryParse(Environment.GetEnvironmentVariable("OPERATION_TIMEOUT_SECONDS"), out var timeout))
        {
            config = new VectorStoreConfiguration
            {
                ConnectionString = config.ConnectionString,
                OpenAIApiKey = config.OpenAIApiKey,
                DatabaseName = config.DatabaseName,
                DefaultCollectionName = config.DefaultCollectionName,
                VectorIndexName = config.VectorIndexName,
                EmbeddingModel = config.EmbeddingModel,
                MaxBatchSize = config.MaxBatchSize,
                OperationTimeoutSeconds = timeout,
                CreateCollectionIfNotExists = config.CreateCollectionIfNotExists
            };
        }

        config.Validate();
        return config;
    }
}
