# Process Steps Sample Application

This sample demonstrates a multi-agent system with frontend web interface, showcasing integration with the Xians.ai platform for document processing and legal workflows.

## Project Structure

### Backend Agents (C# .NET 9)

- **ThePrepAgent** - Power of Attorney document processing agent

### Frontend Web Application (React/TypeScript)

- **POA Module** - Power of Attorney document workflow
- **Testament Module** - Testament/will creation workflow  
- **Chat Interface** - Real-time communication with agents
- **Entity Management** - Data entity exploration and management
- **Findings/Audit** - Audit results and findings display

## Prerequisites

### Xians Platform

Set up the Xians.ai [community edition](https://github.com/XiansAiPlatform/community-edition)

### Development Environment

- .NET 9 SDK (for backend agents)
- Node.js and npm (for frontend)
- Xians.ai account and API key

## Setup and Running

### 1. Backend Agent (ThePrepAgent)

Navigate to the agent directory:

```bash
cd backend-agents/ThePrepAgent
```

Install dependencies:

```bash
dotnet restore
```

Configure the agent by updating the `.env` file with your Xians.ai credentials:

```csv
APP_SERVER_URL=https://api.xians.ai
APP_SERVER_API_KEY=your-actual-api-key-here
```

Run the agent:

```bash
dotnet run
```

### 2. Frontend Web Application

Navigate to the frontend directory:

```bash
cd frontend-web
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

### 3. Configuration

Once both backend and frontend are running, configure the web application:

1. Open the web application in your browser  [http://localhost:5173](http://localhost:5173)
2. Navigate to Account → Settings
3. Update the following settings:
   - **Agent Websocket URL**: `http://localhost:5001/ws/chat`
   - **Agent API Key**: Obtain from Xians Portal Settings (requires Admin access)
   - **Tenant ID**: `default`
   - **Participant ID**: Any GUID (e.g., `bbbf5126-39c9-466d-862a-5746aefe0160`)
