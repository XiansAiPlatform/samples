using DotNetEnv;
using XiansAi.Flow.Router.Plugins;
using GqlIntrospection;

namespace AgentTools;

public class SchemaCapabilities
{
	[Capability("Get the cached GraphQL introspection schema JSON. Automatically refreshes if expired.")]
	[Returns("Raw GraphQL introspection JSON")]
	public async Task<string> GetSchemaRaw()
	{
		if (SchemaCache.TryGet(out var raw))
		{
			return raw;
		}

		return await RefreshIfExpired();
	}

	[Capability("Refresh the GraphQL introspection schema now and update the cache. Uses optimized query that returns only essential schema info.")]
	[Returns("Success or error message with TTL info")]
	public async Task<string> RefreshSchema()
	{
		try
		{
			var svc = new GraphQLIntrospectionService();
			var json = await svc.FetchSchemaAsync();
			var ttlMinutesEnv = Environment.GetEnvironmentVariable("SCHEMA_CACHE_TTL_MINUTES");
			var ttlMinutes = int.TryParse(ttlMinutesEnv, out var v) && v > 0 ? v : 5760;
			SchemaCache.Set(json, TimeSpan.FromMinutes(ttlMinutes));
			return $"Schema refreshed. TTL={ttlMinutes} minutes. ExpiresAtUtc={SchemaCache.ExpiresAtUtc:O}";
		}
		catch (Exception ex)
		{
			return $"Failed to refresh schema: {ex.Message}";
		}
	}

	private async Task<string> RefreshIfExpired()
	{
		if (!await SchemaCache.RefreshLock.WaitAsync(0))
		{
			await SchemaCache.RefreshLock.WaitAsync();
			try
			{
				if (SchemaCache.TryGet(out var cachedValue))
				{
					return cachedValue;
				}
			}
			finally
			{
				SchemaCache.RefreshLock.Release();
			}
		}

		try
		{
			if (SchemaCache.TryGet(out var cached))
			{
				return cached;
			}

			var svc = new GraphQLIntrospectionService();
			var json = await svc.FetchSchemaAsync();
			var ttlMinutesEnv = Environment.GetEnvironmentVariable("SCHEMA_CACHE_TTL_MINUTES");
			var ttlMinutes = int.TryParse(ttlMinutesEnv, out var v) && v > 0 ? v : 5760;
			SchemaCache.Set(json, TimeSpan.FromMinutes(ttlMinutes));
			return json;
		}
		catch (Exception ex)
		{
			return $"Failed to auto-refresh schema: {ex.Message}. Please try calling RefreshSchema manually.";
		}
		finally
		{
			SchemaCache.RefreshLock.Release();
		}
	}
}

