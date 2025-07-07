import { useState, useEffect } from 'react';
import { useSteps } from '../../../context/StepsContext';
import { useWebSocketSteps } from '../../../context/WebSocketStepsContext';
import { getAgentForStep } from '../../../modules/poa/utils/stepUtils';

export const useChatMessages = () => {
  const { steps, activeStep, isInitialized } = useSteps();
  const { getChatMessagesForStep, sendMessage, isConnected, connectionStates } = useWebSocketSteps();
  
  const currentStep = steps[activeStep] || null;
  const currentAgent = currentStep ? getAgentForStep(currentStep) : null;
  const hasBot = Boolean(currentAgent || currentStep?.bot);
  
  // Debug logging - moved to useEffect to prevent infinite renders
  useEffect(() => {
    console.log('[useChatMessages] Debug info:', {
      activeStep,
      currentStep: currentStep ? {
        title: currentStep.title,
        botId: currentStep.botId,
        bot: currentStep.bot
      } : null,
      currentAgent,
      hasBot
    });
  }, [activeStep, currentStep, currentAgent, hasBot]);
  
  const currentMessages = activeStep !== null ? getChatMessagesForStep(activeStep) : [];
  const connectionState = connectionStates.get(activeStep);
  const isStepConnected = connectionState?.status === 'connected';

  const getConnectionStatusMessage = () => {
    if (!isInitialized) return 'Initializing...';
    if (!isConnected) return 'Not connected to chat service';
    if (!isStepConnected) {
      if (connectionState?.status === 'connecting') return 'Connecting...';
      if (connectionState?.status === 'error') return 'Connection error';
      return 'Disconnected';
    }
    return null;
  };

  return {
    currentStep,
    currentAgent,
    hasBot,
    currentMessages,
    connectionState,
    isStepConnected,
    isConnected,
    sendMessage,
    connectionStatusMessage: getConnectionStatusMessage(),
  };
}; 