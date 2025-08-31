/**
 * Utility functions for sending messages to the chat agent
 */

/**
 * Sends a message to the chat agent using window events
 * @param message The message to send to the chat agent
 */
export const sendMessageToAgent = (message: string): void => {
  const sendChatEvent = new CustomEvent('SendChat', {
    detail: {
      message
    }
  });
  window.dispatchEvent(sendChatEvent);
};

/**
 * Creates a formatted validation prompt for the agent
 * @param validation The validation object
 * @param fieldPath The field path where the validation occurred
 * @returns A formatted message for the agent
 */
export const formatValidationPrompt = (
  validation: { message: string; suggestedAction?: string; prompt?: string },
  fieldPath?: string
): string => {
  if (validation.prompt) {
    return validation.prompt;
  }

  // Fallback: create a prompt from validation details
  let message = `I have a validation issue that needs assistance:\n\n`;
  
  if (fieldPath) {
    message += `**Field:** ${fieldPath}\n`;
  }
  
  message += `**Issue:** ${validation.message}\n`;
  
  if (validation.suggestedAction) {
    message += `**Suggested Action:** ${validation.suggestedAction}\n`;
  }
  
  message += `\nPlease help me resolve this validation issue.`;
  
  return message;
};