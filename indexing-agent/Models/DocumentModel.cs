using Microsoft.Extensions.VectorData;
using Microsoft.SemanticKernel.Data;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IndexingAgent.Models;

/// <summary>
/// Data model for documents stored in MongoDB vector collection
/// </summary>
public sealed class DocumentModel
{
    /// <summary>
    /// MongoDB ObjectId (auto-generated)
    /// </summary>
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; init; }

    /// <summary>
    /// Unique identifier for the document
    /// </summary>
    [VectorStoreKey]
    [TextSearchResultName]
    [BsonElement("Key")]
    public required string Key { get; init; }

    /// <summary>
    /// The text content of the document
    /// </summary>
    [VectorStoreData]
    [TextSearchResultValue]
    [BsonElement("Text")]
    public required string Text { get; init; }

    /// <summary>
    /// The vector embedding of the document (1536 dimensions for text-embedding-ada-002)
    /// </summary>
    [VectorStoreVector(1536)]
    [BsonElement("Embedding")]
    public ReadOnlyMemory<float> Embedding { get; init; }

    /// <summary>
    /// Metadata about the document source
    /// </summary>
    [VectorStoreData]
    [BsonElement("Source")]
    public string? Source { get; init; }

    /// <summary>
    /// Timestamp when the document was indexed
    /// </summary>
    [VectorStoreData]
    [BsonElement("IndexedAt")]
    public DateTime IndexedAt { get; init; }

    /// <summary>
    /// Document category or type
    /// </summary>
    [VectorStoreData]
    [BsonElement("Category")]
    public string? Category { get; init; }

    /// <summary>
    /// Additional metadata as key-value pairs
    /// </summary>
    [VectorStoreData]
    [BsonElement("Metadata")]
    public Dictionary<string, object>? Metadata { get; init; }
}
