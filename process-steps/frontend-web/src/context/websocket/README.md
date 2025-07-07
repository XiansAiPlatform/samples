# WebSocket Context Architecture

This directory contains a refactored WebSocket context implementation that follows SOLID principles and provides better maintainability, testability, and code organization.

## Architecture Overview

The previous monolithic `WebSocketStepsContext.tsx` (over 1000 lines) has been refactored into focused, single-responsibility modules:

### Core Components

#### 1. **Types** (`types.ts`)

- Contains all TypeScript interfaces and types
- Centralized type definitions for better maintainability
- Separates concerns between different data structures

#### 2. **AgentManager** (`AgentManager.ts`)

- **Responsibility**: Managing agent lifecycle, caching, and lookup operations
- **Key Features**:
  - Agent caching per module
  - Step-to-agent mapping
  - Workflow ID resolution
  - Handoff message processing

#### 3. **MessageManager** (`MessageManager.ts`)

- **Responsibility**: Chat message management and history
- **Key Features**:
  - Message deduplication
  - Workflow-type-based message routing
  - Thread management
  - Historical message processing

#### 4. **ConnectionManager** (`ConnectionManager.ts`)

- **Responsibility**: WebSocket connection lifecycle and SDK management
- **Key Features**:
  - SDK initialization and configuration
  - Connection state management
  - Settings validation and change detection

#### 5. **ActivityLogManager** (`ActivityLogManager.ts`)

- **Responsibility**: Activity log management and attachment
- **Key Features**:
  - Pending activity log storage
  - Automatic attachment to outgoing messages
  - Activity log subscription handling

#### 6. **HandoffManager** (`HandoffManager.ts`)

- **Responsibility**: Inter-step handoff coordination and navigation
- **Key Features**:
  - Handoff message processing
  - Step navigation logic
  - Typing indicator management
  - Chat history refresh

#### 7. **Main Context** (`WebSocketStepsContext.tsx`)

- **Responsibility**: Orchestration and public API
- **Key Features**:
  - Manager coordination
  - React state management
  - Public API exposure
  - Effect coordination

#### 8. **Custom Hook** (`useWebSocketSteps.ts`)

- **Responsibility**: Context consumption with proper error handling
- **Key Features**:
  - Type-safe context access
  - Error boundaries

## Usage

### Basic Usage

```typescript
import { useWebSocketSteps } from './context/websocket';

function MyComponent() {
  const {
    chatMessages,
    sendMessage,
    isConnected,
    getChatMessagesForStep
  } = useWebSocketSteps();
  
  // Component logic here
}
```

### Advanced Usage (Direct Manager Access)

```typescript
import { AgentManager, MessageManager } from './context/websocket';

// For testing or advanced scenarios
const agentManager = new AgentManager('poa');
const messageManager = new MessageManager(agentManager);
```

## Migration Notes

The refactored context maintains the same public API as the original implementation, ensuring backward compatibility. Existing components using `useWebSocketSteps` should continue to work without changes.

## File Structure

```text
websocket/
├── types.ts                    # Type definitions
├── AgentManager.ts            # Agent management
├── MessageManager.ts          # Message handling
├── ConnectionManager.ts       # Connection management
├── ActivityLogManager.ts      # Activity log management
├── HandoffManager.ts          # Handoff coordination
├── WebSocketStepsContext.tsx  # Main context (refactored)
├── useWebSocketSteps.ts       # Custom hook
├── index.ts                   # Public exports
├── README.md                  # This file
└── WebSocketStepsContext.original.tsx  # Original backup
```
