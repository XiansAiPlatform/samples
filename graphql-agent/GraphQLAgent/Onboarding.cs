public static class Onboarding
{
    public static string GraphQLAgent = @"
            {
                ""display-name"": ""GraphQL Database Assistant"",
                ""version"": ""1.0.0"",
                ""description"": ""An intelligent agent that helps you query databases using natural language through GraphQL."",
                ""author"": ""Xians.ai"",
                ""license"": ""Proprietary"",
                ""tags"": [
                    ""Database"",
                    ""GraphQL"",
                    ""Hasura""
                ],
                ""workflow"": [
                    {
                        ""step"": ""knowledge"",
                        ""name"": ""GraphQL Agent Prompt"",
                        ""description"": ""The main prompt for the GraphQL Database Agent."",
                        ""type"": ""markdown"",
                        ""value"": ""embedded://knowledge-base/GraphQL Agent Prompt.md""
                    },
                    {
                        ""step"": ""activate"",
                        ""name"": ""Activate the agent"",
                        ""description"": ""Activate the main GraphQL agent to start handling queries."",
                        ""value"": [
                            ""GraphQL Database Agent: Main Agent""
                        ]
                    }
                ]
            }
        ";
}

