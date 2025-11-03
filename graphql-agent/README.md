# GraphQL Database Agent

An intelligent .NET agent powered by Xians.ai that translates natural language queries into GraphQL operations for Hasura.

## Overview

This agent enables users to query databases using natural language. It understands conversational database queries, generates valid GraphQL queries using LLM intelligence, executes them against Hasura, and returns formatted results.

## Features

- ✅ Natural language to GraphQL translation
- ✅ Direct execution against Hasura endpoint
- ✅ Smart error handling and retry logic
- ✅ User-friendly response formatting
- ✅ Schema-aware query generation
- ✅ Automatic schema caching and refresh

## Prerequisites

- .NET 9 SDK
- Docker and Docker Compose (for running Hasura)
- Xians.ai account and API key
- OpenAI API key (optional, can use platform default)

## Quick Start

### 1. Configure Environment

Copy the environment template and update with your credentials:

```bash
cd GraphQLAgent
cp .env.template .env
```

Edit `GraphQLAgent/.env` with your actual values:
- `APP_SERVER_API_KEY`: Your Xians.ai API key
- `HASURA_ENDPOINT`: Your Hasura GraphQL endpoint (default: http://localhost:8082/v1/graphql)
- `HASURA_ADMIN_SECRET`: Your Hasura admin secret (if configured)
- `OPENAI_API_KEY`: (Optional) Your OpenAI API key

### 2. Start Hasura

From the `Hasura Configuration` directory:

```bash
cd "Hasura Configuration"
docker-compose up -d
```

Verify Hasura is running at http://localhost:8082

The Hasura console is available at http://localhost:8082/console

### 3. Build and Run

From the `GraphQLAgent` directory:

```bash
cd GraphQLAgent
dotnet restore
dotnet build
dotnet run
```

### 4. Interact with the Agent

The agent is now active and ready to accept queries through the Xians.ai chat interface.

## Usage Examples

- Which car brands have the highest defect rates?
- how many tests do we perform in average per year?
- what are the tests done by vehicle with registration number MNO345?
- whats the type of test we perform mostly?

### Example 1: Count Query

**You**: "How many users do we have?"

**Agent**: 
```
I'll check the total number of users for you.
[Executing query...]
You have 152 users in the database.
```

### Example 2: Filtered Query

**You**: "Show me all users older than 30"

**Agent**:
```
I'll find all users over 30 years old.
[Executing query...]
Found 43 users over 30:
- John Doe (john@example.com) - Age 35
- Jane Smith (jane@example.com) - Age 42
...
```

### Example 3: Relationship Query

**You**: "What posts did Sarah write in January?"

**Agent**:
```
I'll find all posts by Sarah from January.
[Executing query...]
Sarah wrote 5 posts in January:
1. Getting Started with GraphQL (Jan 5)
2. Advanced Querying (Jan 12)
...
```

## License

Proprietary

## Support

For issues or questions:
- Check the main repository documentation
- Review Xians.ai documentation
- Contact support@xians.ai

