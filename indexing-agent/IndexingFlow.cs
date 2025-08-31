using Temporalio.Workflows;
using XiansAi.Flow;
using XiansAi.Logging;
using IndexingAgent.Configuration;
using IndexingAgent.Services;

[Workflow("Indexing Agent:Indexing Flow")]
public class IndexingFlow : FlowBase
{
     [WorkflowRun]
    public async Task Run()
    {
        await InitSchedule();
    }
}

public class ScheduledProcessor : IDisposable
{
    private ScheduledIndexingService? _indexingService;
    private VectorStoreConfiguration? _configuration;
    private readonly Logger<ScheduledProcessor> _logger = Logger<ScheduledProcessor>.For();
    private bool _disposed = false;

    public ScheduledProcessor()
    {
        try
        {
            _configuration = VectorStoreConfiguration.FromEnvironment();
            _indexingService = new ScheduledIndexingService(_configuration);
            _logger.LogInformation("✅ MongoDB Vector Store initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Failed to initialize MongoDB Vector Store: {ex.Message}");
            _logger.LogInformation("Please check your environment variables (ATLAS_CONNECTION_STRING, OPENAI_API_KEY)");
        }
    }

    [IntervalSchedule(seconds: 30)]
    public async void RunEvery30Seconds()
    {
        if (_indexingService == null)
        {
            _logger.LogWarning("⚠️ Indexing service not initialized. Skipping scheduled run.");
            return;
        }

        try
        {
            _logger.LogInformation("🔄 Starting scheduled indexing process...");
            
            // Process scheduled indexing
            await _indexingService.ProcessScheduledIndexingAsync();
            
            // Perform a test search every run to verify functionality
            await _indexingService.PerformTestSearchAsync("developer");
            
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Scheduled processing failed: {ex.Message}");
        }
    }

    [IntervalSchedule(minutes: 60)]
    public async void RunHourlyCleanup()
    {
        if (_indexingService == null)
        {
            _logger.LogWarning("⚠️ Indexing service not initialized. Skipping cleanup.");
            return;
        }

        try
        {
            _logger.LogInformation("🧹 Starting hourly cleanup process...");
            
            // Clean up documents older than 7 days
            await _indexingService.CleanupOldDocumentsAsync(TimeSpan.FromDays(7));
        }
        catch (Exception ex)
        {
            _logger.LogError($"❌ Cleanup process failed: {ex.Message}");
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _indexingService?.Dispose();
            _disposed = true;
        }
    }
}