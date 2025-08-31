# Sending Chat Messages from UI Components

## Overview
The application provides a simple event-based system for UI components to send chat messages to the agent. This allows any component within the application to programmatically send messages without needing direct access to the chat service or complex state management.

## Architecture

### Event-Based Communication
The system uses browser `CustomEvent` to communicate between UI components and the `ChatPanel`. This approach provides:
- **Decoupling**: Components don't need direct references to chat services
- **Simplicity**: Just dispatch an event with a message string
- **Reusability**: Any component can send messages using the same interface

### Message Flow
1. UI component creates a `SendChat` event with a message
2. Event is dispatched to the global `window` object
3. `ChatPanel` listens for `SendChat` events
4. `ChatPanel` adds the message to the chat UI and sends it to the agent

## Usage

### Basic Example
```typescript
// Send a simple message
const sendChatEvent = new CustomEvent('SendChat', {
  detail: {
    message: "Hello, agent! Please help me with this task."
  }
});

window.dispatchEvent(sendChatEvent);
```

### From a React Component
```typescript
import React from 'react';
import { Button } from '@mui/material';

const MyComponent: React.FC = () => {
  const handleSendMessage = () => {
    const message = "Please analyze the current document for compliance issues.";
    
    const sendChatEvent = new CustomEvent('SendChat', {
      detail: {
        message: message
      }
    });
    
    window.dispatchEvent(sendChatEvent);
  };

  return (
    <Button onClick={handleSendMessage}>
      Analyze Document
    </Button>
  );
};
```

### From UI Components in Chat
```typescript
// EditParty.tsx example
const handleDone = () => {
  const message = `Please add the following party to the current contract:

**Party Details:**
- **Name:** ${partyData.name}
- **Role:** ${partyData.role}
- **Email:** ${partyData.email}
- **Organization:** ${partyData.organization}
- **Address:** ${partyData.address}

Please update the contract document to include this party with their specified role and contact information.`;

  const sendChatEvent = new CustomEvent('SendChat', {
    detail: {
      message: message
    }
  });
  
  window.dispatchEvent(sendChatEvent);
};
```

## Event Structure

### SendChat Event
```typescript
interface SendChatEvent extends CustomEvent {
  detail: {
    message: string;
  }
}
```

### Properties
- **message**: The chat message string to send to the agent. Can include markdown formatting.

## Best Practices

### Message Formatting
- Use **markdown formatting** for better readability (bold, lists, etc.)
- Structure messages clearly with headings and sections
- Include relevant context and specific instructions for the agent

### Error Handling
- The system handles connection states automatically
- Messages are queued if the chat service is temporarily unavailable
- Check browser console for any dispatch errors

### Message Content Guidelines
- Be specific and clear in instructions
- Include all necessary context in the message
- Use structured format for complex data (like the party example above)

## Example Use Cases

### 1. Action Buttons
Components that trigger specific agent actions:
```typescript
const requestAnalysis = () => {
  const sendChatEvent = new CustomEvent('SendChat', {
    detail: {
      message: "Please perform a security analysis on the uploaded document."
    }
  });
  window.dispatchEvent(sendChatEvent);
};
```

### 2. Form Submissions
Forms that need to send structured data to the agent:
```typescript
const submitFormData = (formData: FormData) => {
  const message = `Please process this form submission:

**Customer Information:**
- Name: ${formData.name}
- Email: ${formData.email}
- Request Type: ${formData.requestType}

Please create the appropriate documentation and follow up with next steps.`;

  const sendChatEvent = new CustomEvent('SendChat', {
    detail: { message }
  });
  window.dispatchEvent(sendChatEvent);
};
```

### 3. Status Updates
Components that need to notify the agent of state changes:
```typescript
const notifyCompletion = (taskName: string) => {
  const sendChatEvent = new CustomEvent('SendChat', {
    detail: {
      message: `Task "${taskName}" has been completed. Please review and provide next steps.`
    }
  });
  window.dispatchEvent(sendChatEvent);
};
```

## Technical Implementation

### ChatPanel Integration
The `ChatPanel` component automatically listens for `SendChat` events and:
1. Validates the message content
2. Adds the message to the chat UI as a user message
3. Sends the message to the connected agent via `CommsService`
4. Handles loading states and error conditions

### Connection Management
- Messages are only sent when the chat service is connected
- Connection state is managed automatically by `ChatPanel`
- Failed messages are logged to the console with appropriate error messages

## Migration from DataMessageContext

If you're migrating from the previous `DataMessageContext` approach:

```typescript
// Old approach (deprecated)
dataMessageContext.publish(complexMessageObject);

// New approach (recommended)
const sendChatEvent = new CustomEvent('SendChat', {
  detail: {
    message: "Your formatted message string"
  }
});
window.dispatchEvent(sendChatEvent);
```

The new approach is simpler and more maintainable, focusing on the essential task of sending a chat message rather than complex data structures.