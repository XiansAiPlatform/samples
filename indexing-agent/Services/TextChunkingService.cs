using IndexingAgent.Models;
using XiansAi.Logging;

namespace IndexingAgent.Services;

/// <summary>
/// Service for chunking large text documents into smaller, manageable pieces
/// </summary>
public class TextChunkingService
{
    private static readonly Logger<TextChunkingService> _logger = Logger<TextChunkingService>.For();

    /// <summary>
    /// Chunks a document into smaller pieces with overlap
    /// </summary>
    /// <param name="document">The document to chunk</param>
    /// <param name="maxChunkSize">Maximum size of each chunk in characters</param>
    /// <param name="overlapSize">Number of characters to overlap between chunks</param>
    /// <returns>List of chunked documents</returns>
    public static List<DocumentToIndex> ChunkDocument(
        DocumentToIndex document, 
        int maxChunkSize = 8000, 
        int overlapSize = 400)
    {
        if (string.IsNullOrEmpty(document.Text) || document.Text.Length <= maxChunkSize)
        {
            // Document is small enough, return as-is
            return new List<DocumentToIndex> { document };
        }

        var chunks = new List<DocumentToIndex>();
        var text = document.Text;
        var chunkIndex = 0;

        _logger.LogInformation($"📄 Chunking document '{document.Key}' ({text.Length:N0} chars) into ~{maxChunkSize:N0} char chunks");

        for (int start = 0; start < text.Length; start += maxChunkSize - overlapSize)
        {
            var end = Math.Min(start + maxChunkSize, text.Length);
            var chunkText = text.Substring(start, end - start);

            // Try to break at sentence boundaries for better context
            if (end < text.Length && !char.IsWhiteSpace(text[end]))
            {
                var lastSentence = chunkText.LastIndexOf('.');
                var lastParagraph = chunkText.LastIndexOf('\n');
                var lastSpace = chunkText.LastIndexOf(' ');

                // Prefer sentence break, then paragraph break, then word break
                var breakPoint = -1;
                if (lastSentence > maxChunkSize - 1000) // If sentence break is reasonably close
                    breakPoint = lastSentence + 1;
                else if (lastParagraph > maxChunkSize - 500) // If paragraph break is reasonably close
                    breakPoint = lastParagraph;
                else if (lastSpace > maxChunkSize - 200) // If word break is reasonably close
                    breakPoint = lastSpace;

                if (breakPoint > 0)
                {
                    chunkText = chunkText.Substring(0, breakPoint);
                    end = start + breakPoint;
                }
            }

            // Create chunk metadata
            var chunkMetadata = new Dictionary<string, object>(document.Metadata ?? new Dictionary<string, object>())
            {
                ["chunk_index"] = chunkIndex,
                ["chunk_start"] = start,
                ["chunk_end"] = end,
                ["total_chunks"] = -1, // Will be updated after all chunks are created
                ["original_document_key"] = document.Key ?? "unknown",
                ["original_document_length"] = text.Length,
                ["is_chunk"] = true
            };

            // Create unique key for chunk
            var chunkKey = $"{document.Key}_chunk_{chunkIndex:D3}";

            var chunk = new DocumentToIndex
            {
                Key = chunkKey,
                Text = chunkText.Trim(),
                Source = document.Source,
                Category = document.Category,
                Metadata = chunkMetadata
            };

            chunks.Add(chunk);
            chunkIndex++;

            // If we've reached the end, break
            if (end >= text.Length)
                break;
        }

        // Update total_chunks metadata for all chunks
        foreach (var chunk in chunks)
        {
            if (chunk.Metadata != null)
                chunk.Metadata["total_chunks"] = chunks.Count;
        }

        _logger.LogInformation($"✂️ Created {chunks.Count} chunks from document '{document.Key}'");

        return chunks;
    }

    /// <summary>
    /// Chunks multiple documents
    /// </summary>
    /// <param name="documents">Documents to chunk</param>
    /// <param name="maxChunkSize">Maximum size of each chunk in characters</param>
    /// <param name="overlapSize">Number of characters to overlap between chunks</param>
    /// <returns>List of chunked documents</returns>
    public static List<DocumentToIndex> ChunkDocuments(
        IEnumerable<DocumentToIndex> documents,
        int maxChunkSize = 8000,
        int overlapSize = 400)
    {
        var allChunks = new List<DocumentToIndex>();
        var totalDocuments = 0;
        var chunkedDocuments = 0;

        foreach (var document in documents)
        {
            totalDocuments++;
            var chunks = ChunkDocument(document, maxChunkSize, overlapSize);
            
            if (chunks.Count > 1)
                chunkedDocuments++;
                
            allChunks.AddRange(chunks);
        }

        _logger.LogInformation($"📊 Chunking summary: {totalDocuments} documents → {allChunks.Count} chunks ({chunkedDocuments} documents were chunked)");

        return allChunks;
    }

    /// <summary>
    /// Estimates the number of tokens in a text (rough approximation)
    /// </summary>
    /// <param name="text">Text to estimate</param>
    /// <returns>Estimated token count</returns>
    public static int EstimateTokenCount(string text)
    {
        if (string.IsNullOrEmpty(text))
            return 0;

        // Rough approximation: 1 token ≈ 4 characters for English text
        return text.Length / 4;
    }

    /// <summary>
    /// Gets optimal chunk size based on embedding model limits
    /// </summary>
    /// <param name="modelName">Name of the embedding model</param>
    /// <returns>Recommended chunk size in characters</returns>
    public static int GetOptimalChunkSize(string modelName = "text-embedding-ada-002")
    {
        return modelName.ToLower() switch
        {
            "text-embedding-ada-002" => 6000, // ~1500 tokens * 4 chars/token, leaving buffer
            "text-embedding-3-small" => 6000, // Similar limits
            "text-embedding-3-large" => 6000, // Similar limits
            _ => 6000 // Default safe size
        };
    }

    /// <summary>
    /// Gets optimal overlap size based on chunk size
    /// </summary>
    /// <param name="chunkSize">Size of chunks in characters</param>
    /// <returns>Recommended overlap size in characters</returns>
    public static int GetOptimalOverlapSize(int chunkSize)
    {
        // Overlap should be about 5-10% of chunk size, minimum 200 chars
        return Math.Max(200, chunkSize / 15);
    }
}
