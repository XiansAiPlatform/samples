using DotNetEnv;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;

namespace GqlIntrospection;

public class GraphQLIntrospectionService
{
	private readonly string _endpoint;
	private readonly string? _adminSecret;
	private readonly HttpClient _httpClient;

	public GraphQLIntrospectionService()
	{
		_endpoint = Env.GetString("HASURA_ENDPOINT") ?? "http://localhost:8080/v1/graphql";
		_adminSecret = Env.GetString("HASURA_ADMIN_SECRET");
		_httpClient = new HttpClient
		{
			Timeout = TimeSpan.FromSeconds(60)
		};
	}

	public async Task<string> FetchSchemaAsync(CancellationToken cancellationToken = default)
	{
		var introspectionQuery = GetIntrospectionQuery();

		var payload = new
		{
			query = introspectionQuery
		};

		var request = new HttpRequestMessage(HttpMethod.Post, _endpoint)
		{
			Content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json")
		};

		if (!string.IsNullOrWhiteSpace(_adminSecret))
		{
			request.Headers.Add("x-hasura-admin-secret", _adminSecret);
		}

		var response = await _httpClient.SendAsync(request, cancellationToken);
		var json = await response.Content.ReadAsStringAsync(cancellationToken);

		if (!response.IsSuccessStatusCode)
		{
			throw new InvalidOperationException($"Introspection HTTP error: {(int)response.StatusCode} {response.StatusCode}. Body: {json}");
		}

		// Basic sanity check for errors field
		var root = JsonConvert.DeserializeObject<JObject>(json);
		if (root == null)
		{
			throw new InvalidOperationException("Introspection returned empty response");
		}
		if (root["errors"] != null)
		{
			throw new InvalidOperationException($"Introspection GraphQL errors: {root["errors"]!.ToString(Formatting.None)}");
		}

		return json;
	}

	private static string GetIntrospectionQuery()
	{
		return @"query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      kind
      name
      description
      fields(includeDeprecated: false) {
        name
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
      enumValues(includeDeprecated: false) {
        name
      }
    }
  }
}";
	}
}
