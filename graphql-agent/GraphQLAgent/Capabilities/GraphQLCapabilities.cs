using XiansAi.Flow.Router.Plugins;
using Newtonsoft.Json;
using DotNetEnv;
using System.Text;

namespace AgentTools;

public class GraphQLRequest
{
    [JsonProperty("query")]
    public required string Query { get; set; }

    [JsonProperty("variables")]
    public Dictionary<string, object>? Variables { get; set; }
}

public class GraphQLError
{
    [JsonProperty("message")]
    public required string Message { get; set; }

    [JsonProperty("extensions")]
    public Dictionary<string, object>? Extensions { get; set; }
}

public class GraphQLResponse
{
    [JsonProperty("data")]
    public Dictionary<string, object>? Data { get; set; }

    [JsonProperty("errors")]
    public List<GraphQLError>? Errors { get; set; }
}

public class GraphQLCapabilities
{
    private readonly string _hasuraEndpoint;
    private readonly string? _adminSecret;
    private readonly HttpClient _httpClient;

    public GraphQLCapabilities()
    {
        _hasuraEndpoint = Env.GetString(Constants.EnvHasuraEndpoint) ?? "http://localhost:8080/v1/graphql";
        _adminSecret = Env.GetString(Constants.EnvHasuraAdminSecret);
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    [Capability("Execute a GraphQL query against the Hasura database. Use this to retrieve data from the database based on natural language queries.")]
    [Parameter("query", "The GraphQL query string to execute")]
    [Parameter("description", "A brief description of what this query does (for logging)")]
    [Returns("The query results as a JSON string, or an error message if the query fails")]
    public async Task<string> ExecuteGraphQLQuery(string query, string description = "")
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return "Error: GraphQL query cannot be empty.";
            }

            var request = new GraphQLRequest
            {
                Query = query.Trim()
            };

            var jsonContent = JsonConvert.SerializeObject(request);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, _hasuraEndpoint)
            {
                Content = httpContent
            };

            if (!string.IsNullOrEmpty(_adminSecret))
            {
                httpRequest.Headers.Add("x-hasura-admin-secret", _adminSecret);
            }

            var response = await _httpClient.SendAsync(httpRequest);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return $"HTTP Error: {response.StatusCode}. Response: {responseContent}";
            }

            var graphQLResponse = JsonConvert.DeserializeObject<GraphQLResponse>(responseContent);

            if (graphQLResponse == null)
            {
                return "Error: Invalid response from Hasura.";
            }

            if (graphQLResponse.Errors != null && graphQLResponse.Errors.Count > 0)
            {
                var errorMessages = string.Join(", ", graphQLResponse.Errors.Select(e => e.Message));
                return $"GraphQL Error: {errorMessages}";
            }

            if (graphQLResponse.Data == null)
            {
                return "No data returned from the query.";
            }

            return FormatResponse(graphQLResponse.Data);
        }
        catch (HttpRequestException ex)
        {
            return $"Network error: {ex.Message}. Please check if Hasura is running and accessible.";
        }
        catch (Exception ex)
        {
            return $"Unexpected error: {ex.Message}";
        }
    }

    private string FormatResponse(Dictionary<string, object> data)
    {
        try
        {
            var json = JsonConvert.SerializeObject(data, Formatting.Indented);
            return json;
        }
        catch
        {
            return JsonConvert.SerializeObject(data);
        }
    }

    public void Dispose()
    {
        _httpClient?.Dispose();
    }
}

