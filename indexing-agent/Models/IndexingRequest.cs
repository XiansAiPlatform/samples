namespace IndexingAgent.Models;

/// <summary>
/// Represents a request to index documents
/// </summary>
public class IndexingRequest
{
    /// <summary>
    /// List of documents to be indexed
    /// </summary>
    public required List<DocumentToIndex> Documents { get; init; }

    /// <summary>
    /// Collection name to store the documents
    /// </summary>
    public string CollectionName { get; init; } = "documents";

    /// <summary>
    /// Whether to overwrite existing documents with the same key
    /// </summary>
    public bool OverwriteExisting { get; init; } = true;

    /// <summary>
    /// Batch size for processing documents
    /// </summary>
    public int BatchSize { get; init; } = 100;
}

/// <summary>
/// Represents a document to be indexed
/// </summary>
public class DocumentToIndex
{
    /// <summary>
    /// Unique identifier for the document
    /// </summary>
    public string? Key { get; init; }

    /// <summary>
    /// The text content to be indexed
    /// </summary>
    public required string Text { get; init; }

    /// <summary>
    /// Source of the document (file path, URL, etc.)
    /// </summary>
    public string? Source { get; init; }

    /// <summary>
    /// Category or type of the document
    /// </summary>
    public string? Category { get; init; }

    /// <summary>
    /// Additional metadata
    /// </summary>
    public Dictionary<string, object>? Metadata { get; set; }
}
