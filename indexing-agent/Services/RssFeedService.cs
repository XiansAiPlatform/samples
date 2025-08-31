using System.ServiceModel.Syndication;
using System.Xml;
using System.Security.Cryptography;
using System.Text;
using IndexingAgent.Models;
using XiansAi.Logging;

namespace IndexingAgent.Services;

/// <summary>
/// Service for reading and processing RSS feeds as document sources
/// </summary>
public class RssFeedService : IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly Dictionary<string, DateTime> _lastFetchTimes;
    private readonly Logger<RssFeedService> _logger = Logger<RssFeedService>.For();

    public RssFeedService()
    {
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("User-Agent", 
            "IndexingAgent/1.0 (Educational Purpose)");
        _lastFetchTimes = new Dictionary<string, DateTime>();
    }

    /// <summary>
    /// Gets new documents from RSS feeds since last fetch
    /// </summary>
    public async Task<List<DocumentToIndex>> GetNewDocumentsAsync(
        List<string> feedUrls, 
        CancellationToken cancellationToken = default)
    {
        var documents = new List<DocumentToIndex>();

        foreach (var feedUrl in feedUrls)
        {
            try
            {
                var feedDocuments = await ProcessRssFeedAsync(feedUrl, cancellationToken);
                documents.AddRange(feedDocuments);
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"⚠️ Failed to process RSS feed {feedUrl}: {ex.Message}");
            }
        }

        return documents;
    }

    private async Task<List<DocumentToIndex>> ProcessRssFeedAsync(
        string feedUrl, 
        CancellationToken cancellationToken)
    {
        var documents = new List<DocumentToIndex>();
        var lastFetch = _lastFetchTimes.GetValueOrDefault(feedUrl, DateTime.MinValue);

        try
        {
            var response = await _httpClient.GetStringAsync(feedUrl, cancellationToken);
            
            using var stringReader = new StringReader(response);
            using var xmlReader = XmlReader.Create(stringReader);
            
            var feed = SyndicationFeed.Load(xmlReader);
            var currentFetch = DateTime.UtcNow;

            foreach (var item in feed.Items)
            {
                // Only process items newer than last fetch
                var publishDate = item.PublishDate.DateTime;
                if (publishDate <= lastFetch)
                    continue;

                var document = CreateDocumentFromFeedItem(item, feed.Title?.Text ?? "Unknown Feed");
                if (document != null)
                {
                    documents.Add(document);
                }
            }

            _lastFetchTimes[feedUrl] = currentFetch;
            
            if (documents.Any())
            {
                _logger.LogInformation($"📰 Found {documents.Count} new articles from {feed.Title?.Text}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Error processing RSS feed {feedUrl}: {ex.Message}");
        }

        return documents;
    }

    private DocumentToIndex? CreateDocumentFromFeedItem(SyndicationItem item, string feedTitle)
    {
        try
        {
            var title = item.Title?.Text ?? "Untitled";
            var summary = item.Summary?.Text ?? "";
            var content = GetItemContent(item);
            
            // Combine title, summary, and content
            var fullText = $"{title}\n\n{summary}";
            if (!string.IsNullOrEmpty(content) && content != summary)
            {
                fullText += $"\n\n{content}";
            }

            // Skip if content is too short
            if (fullText.Length < 50)
                return null;

            // Generate a consistent key based on URL or content hash
            var url = item.Links?.FirstOrDefault()?.Uri?.ToString() ?? "";
            var documentKey = !string.IsNullOrEmpty(url) 
                ? GenerateHashFromUrl(url)
                : GenerateHashFromContent(fullText.Trim());

            var document = new DocumentToIndex
            {
                Key = documentKey,
                Text = fullText.Trim(),
                Source = $"rss_{feedTitle.Replace(" ", "_").ToLower()}",
                Category = "news_article",
                Metadata = new Dictionary<string, object>
                {
                    ["title"] = title,
                    ["feed_title"] = feedTitle,
                    ["publish_date"] = item.PublishDate.ToString("O"),
                    ["url"] = url,
                    ["authors"] = item.Authors?.Select(a => a.Name).ToArray() ?? Array.Empty<string>(),
                    ["categories"] = item.Categories?.Select(c => c.Name).ToArray() ?? Array.Empty<string>(),
                    ["fetched_at"] = DateTime.UtcNow.ToString("O")
                }
            };

            return document;
        }
        catch (Exception ex)
        {
            _logger.LogWarning($"⚠️ Error creating document from feed item: {ex.Message}");
            return null;
        }
    }

    private string GetItemContent(SyndicationItem item)
    {
        // Try to get the most detailed content available
        var content = item.Content as TextSyndicationContent;
        if (content != null && !string.IsNullOrEmpty(content.Text))
        {
            return StripHtml(content.Text);
        }

        // Fallback to summary
        if (item.Summary != null && !string.IsNullOrEmpty(item.Summary.Text))
        {
            return StripHtml(item.Summary.Text);
        }

        return "";
    }

    private string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html))
            return "";

        // Simple HTML tag removal (for production, consider using HtmlAgilityPack)
        var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]*>", "");
        text = System.Net.WebUtility.HtmlDecode(text);
        
        return text.Trim();
    }

    /// <summary>
    /// Generates a consistent hash from a URL
    /// </summary>
    private string GenerateHashFromUrl(string url)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(url));
        return "url_" + Convert.ToHexString(hashBytes)[..16].ToLower();
    }

    /// <summary>
    /// Generates a consistent hash from content
    /// </summary>
    private string GenerateHashFromContent(string content)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(content));
        return "content_" + Convert.ToHexString(hashBytes)[..16].ToLower();
    }

    /// <summary>
    /// Gets a curated list of high-quality, free RSS feeds
    /// </summary>
    public static List<string> GetRecommendedFeeds()
    {
        return new List<string>
        {
            // Technology News
            "https://stackoverflow.blog/feed/",
            "https://github.blog/feed/",
             
            // Microsoft/Azure
            "https://devblogs.microsoft.com/dotnet/feed/",
            "https://azure.microsoft.com/en-us/blog/feed/",
            
            // General Tech
            "https://feeds.feedburner.com/TechCrunch",
            "https://www.wired.com/feed/rss",
            
            // // Developer Resources
            // "https://css-tricks.com/feed/",
            // "https://www.smashingmagazine.com/feed/",

        };
    }

    public void Dispose()
    {
        _httpClient?.Dispose();
    }
}
