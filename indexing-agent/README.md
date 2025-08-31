# MongoDB Vector Indexing Agent

This project implements a scheduled indexing agent that uses MongoDB Atlas Vector Search with Microsoft Semantic Kernel to perform automated document indexing and semantic search operations.

## Features

- **Scheduled Vector Indexing**: Automatically indexes documents into MongoDB Atlas Vector Search
- **Semantic Search**: Performs similarity searches using OpenAI embeddings
- **Batch Processing**: Efficiently processes documents in configurable batches
- **Error Handling**: Comprehensive error handling and logging
- **Cleanup Operations**: Automatic cleanup of old documents
- **Flexible Configuration**: Environment-based configuration
- **Real-time Monitoring**: Console logging with timestamps and status indicators

## Architecture

The system consists of several key components:

### Core Classes

1. **`DocumentModel`** - Data model for vector documents stored in MongoDB
2. **`VectorStoreConfiguration`** - Configuration management for MongoDB and OpenAI settings
3. **`MongoVectorStoreService`** - Core service for MongoDB vector operations
4. **`ScheduledIndexingService`** - High-level service for scheduled indexing operations
5. **`IndexingFlow`** - Temporal workflow integration with scheduled processors

### Key Features

- **Vector Embeddings**: Uses OpenAI's `text-embedding-ada-002` model (1536 dimensions)
- **MongoDB Integration**: Leverages MongoDB Atlas Vector Search capabilities
- **Semantic Kernel**: Built on Microsoft Semantic Kernel framework
- **Temporal Workflows**: Integrated with Temporal for reliable scheduling

## Prerequisites

1. **MongoDB Atlas Cluster** (version 6.0.11, 7.0.2, or later)
2. **OpenAI API Account** with available credits
3. **.NET 9.0** or later
4. **Environment Variables** configured (see Configuration section)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   dotnet restore
   ```

3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables (see Configuration section)

## Configuration

Create a `.env` file with the following variables:

```bash
# Required
ATLAS_CONNECTION_STRING=mongodb+srv://<username>:<password>@<cluster>.<hostname>.mongodb.net
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional (with defaults)
MONGODB_DATABASE=semantic_kernel_db
MONGODB_COLLECTION=documents
VECTOR_INDEX_NAME=vector_index
EMBEDDING_MODEL=text-embedding-ada-002
MAX_BATCH_SIZE=100
OPERATION_TIMEOUT_SECONDS=30
```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Create a database (default: `semantic_kernel_db`)
3. Create a collection (default: `documents`)
4. Create a vector search index on the collection:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "Embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

## Usage

### Running the Application

```bash
dotnet run
```

The application will:
1. Initialize the MongoDB Vector Store connection
2. Start scheduled indexing every 30 seconds
3. Perform hourly cleanup operations
4. Log all operations to the console

### Scheduled Operations

- **Every 30 seconds**: Index new documents and perform test searches
- **Every hour**: Clean up documents older than 7 days

### Sample Output

```
[2024-01-15 10:30:00] ✅ MongoDB Vector Store initialized successfully
[2024-01-15 10:30:00] 🔄 Starting scheduled indexing process...
[2024-01-15 10:30:01] Found 5 documents to index.
[2024-01-15 10:30:03] ✅ Successfully processed 5 documents
[2024-01-15 10:30:03] Collection 'documents' now contains 15 documents.
[2024-01-15 10:30:03] Performing test search for: 'developer'
[2024-01-15 10:30:04] Found 3 similar documents:
  1. I am a software developer working with C# and .NET technologies
     Source: user_profile_001
     Category: profile
  2. I started using MongoDB Atlas Vector Search two years ago for building AI applications
     Source: user_experience_002
     Category: experience
```

## API Reference

### MongoVectorStoreService

#### `IndexDocumentsAsync(IndexingRequest request)`
Indexes a batch of documents into the vector store.

#### `SearchSimilarAsync(string query, string collectionName, int limit)`
Performs semantic search for similar documents.

#### `GetCollectionStatsAsync(string collectionName)`
Retrieves statistics about a collection.

### ScheduledIndexingService

#### `ProcessScheduledIndexingAsync()`
Processes a scheduled indexing job.

#### `PerformTestSearchAsync(string query)`
Performs a test search to verify indexing functionality.

#### `CleanupOldDocumentsAsync(TimeSpan maxAge)`
Cleans up documents older than the specified age.

## Data Models

### DocumentModel
```csharp
public sealed class DocumentModel
{
    public required string Key { get; init; }           // Unique identifier
    public required string Text { get; init; }          // Document text
    public ReadOnlyMemory<float> Embedding { get; init; } // Vector embedding
    public string? Source { get; init; }                // Document source
    public DateTime IndexedAt { get; init; }            // Index timestamp
    public string? Category { get; init; }              // Document category
    public Dictionary<string, object>? Metadata { get; init; } // Additional metadata
}
```

### IndexingRequest
```csharp
public class IndexingRequest
{
    public required List<DocumentToIndex> Documents { get; init; }
    public string CollectionName { get; init; } = "documents";
    public bool OverwriteExisting { get; init; } = true;
    public int BatchSize { get; init; } = 100;
}
```

## Customization

### Adding Custom Document Sources

Modify the `GetDocumentsToIndexAsync()` method in `ScheduledIndexingService` to:

1. **File System Monitoring**: Watch for new files
2. **Database Change Streams**: Monitor database changes
3. **Message Queues**: Process queued documents
4. **API Integration**: Fetch from external APIs
5. **Upload Processing**: Handle file uploads

### Custom Scheduling

Modify the `ScheduledProcessor` class to adjust:
- Indexing frequency
- Cleanup intervals
- Batch sizes
- Error handling strategies

### Vector Search Customization

Adjust vector search parameters in `MongoVectorStoreService`:
- Similarity metrics
- Search limits
- Filtering criteria
- Metadata queries

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify MongoDB Atlas connection string
   - Check network connectivity and IP whitelist
   - Ensure database and collection exist

2. **OpenAI API Errors**
   - Verify API key is valid
   - Check API quota and billing
   - Monitor rate limits

3. **Embedding Errors**
   - Ensure text content is not empty
   - Check for special characters or encoding issues
   - Verify embedding model availability

### Logging

The application provides detailed console logging with:
- Timestamps for all operations
- Success/failure indicators (✅/❌)
- Error messages and stack traces
- Operation statistics

## Performance Considerations

- **Batch Size**: Adjust `MAX_BATCH_SIZE` based on document size and memory constraints
- **Timeout Settings**: Configure `OPERATION_TIMEOUT_SECONDS` for network conditions
- **Indexing Frequency**: Balance between real-time updates and system load
- **Cleanup Frequency**: Regular cleanup prevents storage bloat

## Security

- Store sensitive credentials in environment variables
- Use MongoDB Atlas security features (IP whitelisting, authentication)
- Implement proper error handling to avoid credential leakage
- Consider using Azure Key Vault or similar for production deployments

## License

This project is part of the Flowmaxer.ai Community Edition samples.
