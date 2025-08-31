# AI Studio - React Web Application

A React-based web application that enables users to discover and engage with AI agents within the organization. Built with Scandinavian design principles emphasizing simplicity, functionality, and clean aesthetics.

## 🛠️ Tech Stack

- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Material-UI v5** for consistent design system
- **React Router v6** for navigation
- **TanStack Query** for server state management
- **Axios** for HTTP client
- **React Hook Form + Zod** for forms and validation
- **XiansAI Socket SDK** for real-time agent communication

## 📱 Features

### Chat Interface

- Agent selection dropdown
- Real-time message display
- File and action message support
- Message timestamps
- Typing indicators

### Business Entity Management

- Dynamic entity display (orders, customers, invoices)
- Inline editing capabilities
- Status tracking with color-coded chips
- Detailed entity information panels

### AI Recommendations

- Priority-based recommendation grouping
- Different recommendation types (validation, warning, suggestion, info)
- Actionable insights with apply/dismiss options
- Real-time recommendation updates

### UI Components in AI Chat

- Agent is able to send commands to the UI
- UI renders different components based on the command

## 🔌 Socket SDK Integration

The application integrates with XiansAI backend agents using the Socket SDK for real-time bidirectional communication.

### Features

- **Real-time messaging** with backend agents
- **Auto-reconnection** with connection state monitoring
- **Workflow mapping** from agent configuration to SDK workflow property
- **Message history** retrieval and display
- **Error handling** with user-friendly feedback
- **Connection status** indicators

### Configuration

Create a `.env.local` file with your XiansAI configuration:

```env
VITE_XIANSAI_TENANT_ID=your-tenant-id
VITE_XIANSAI_API_KEY=sk-your-api-key
VITE_XIANSAI_SERVER_URL=https://api.yourdomain.com
VITE_XIANSAI_PARTICIPANT_ID=default-participant
```

### Workflow Mapping

Agents are configured in `App.tsx` file. Each agent in the application has a `bot` and `flow` properties that maps directly to the workflow ids of the agent. Backend agent can have a bot and a flow (for data).

```typescript
const agents: Agent[] = [
  {
    id: '1',
    name: 'Legal Assistant',
    bot: 'Legal Contract Agent:Legal Contract Bot', // Maps to SDK bot
    flow: 'Legal Contract Agent:Legal Contract Bot', // Maps to SDK flow
    // ... other properties
  }
];
```

### Installation

```bash
# Navigate to the project directory
cd samples/web-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

Built with ❤️ using React, TypeScript, and Xians.ai.
