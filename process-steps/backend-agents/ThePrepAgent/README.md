# Xians.ai Agent

This is a .NET 9 console application that implements a Xians.ai agent using the XiansAi.Lib SDK.

## Prerequisites

- .NET 9 SDK
- Xians.ai account and API key

## Setup

1. **Clone or download this project**

2. **Install dependencies**
   ```bash
   dotnet restore
   ```

3. **Configure your agent**
   
   Update the `.env` file with your actual Xians.ai credentials:
   ```
   APP_SERVER_URL=https://api.xians.ai
   APP_SERVER_API_KEY=your-actual-api-key-here
   ```
   
   You can obtain your API key from the Xians.ai portal's Settings page.

## Running the Agent

```bash
dotnet run
```

## Configuration Options

This project uses the `.env` file approach for configuration, which provides better security and maintainability. The following environment variables are supported:

- `APP_SERVER_URL`: The Xians.ai API server URL (defaults to https://api.xians.ai)
- `APP_SERVER_API_KEY`: Your Xians.ai API key (required)

### Alternative Configuration Methods

If you prefer, you can also configure the agent by:

1. **Hardcoding values** (not recommended for production):
   ```csharp
   PlatformConfig.APP_SERVER_URL = "https://api.xians.ai";
   PlatformConfig.APP_SERVER_API_KEY = "your-api-key";
   ```

2. **Using system environment variables** instead of the .env file

## Project Structure

- `Program.cs` - Main application entry point with Xians.ai configuration
- `.env` - Environment variables for configuration
- `XiansAgent.csproj` - Project file with dependencies

## Dependencies

- **XiansAi.Lib** - The official Xians.ai SDK
- **DotNetEnv** - For loading environment variables from .env file

## Next Steps

This is a basic agent setup. You can extend it by:

1. Adding your custom agent logic
2. Implementing specific agent behaviors
3. Adding logging and error handling
4. Deploying to your preferred hosting environment 