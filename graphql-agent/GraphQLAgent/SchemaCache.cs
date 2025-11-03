using System;

public static class SchemaCache
{
	private static string? _rawJson;
	private static DateTime _expiresAtUtc = DateTime.MinValue;
	private static readonly object _lock = new object();
	private static readonly SemaphoreSlim _refreshLock = new SemaphoreSlim(1, 1);

	public static void Set(string rawJson, TimeSpan ttl)
	{
		lock (_lock)
		{
			_rawJson = rawJson;
			_expiresAtUtc = DateTime.UtcNow.Add(ttl);
		}
	}

	public static bool TryGet(out string rawJson)
	{
		lock (_lock)
		{
			if (!string.IsNullOrEmpty(_rawJson) && DateTime.UtcNow < _expiresAtUtc)
			{
				rawJson = _rawJson!;
				return true;
			}
		}
		rawJson = string.Empty;
		return false;
	}

	public static bool IsExpired()
	{
		lock (_lock)
		{
			return string.IsNullOrEmpty(_rawJson) || DateTime.UtcNow >= _expiresAtUtc;
		}
	}

	public static void Clear()
	{
		lock (_lock)
		{
			_rawJson = null;
			_expiresAtUtc = DateTime.MinValue;
		}
	}

	public static DateTime? ExpiresAtUtc
	{
		get
		{
			lock (_lock)
			{
				return _expiresAtUtc == DateTime.MinValue ? null : _expiresAtUtc;
			}
		}
	}

	/// <summary>
	/// Gets the SemaphoreSlim for coordinating refresh operations to prevent multiple concurrent refreshes
	/// </summary>
	public static SemaphoreSlim RefreshLock => _refreshLock;
}
