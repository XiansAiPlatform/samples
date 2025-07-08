import { useState, useEffect } from 'react';
import { useSteps } from '../../../context/StepsContext';
import { useWebSocketSteps } from '../../../context/websocket';
import { getModuleBySlug } from '../../../modules/modules';
import { useLocation } from 'react-router-dom';

export const useChatMessages = () => {
  const { steps, activeStep, isInitialized } = useSteps();
  const { getChatMessagesForStep, sendMessage, isConnected, connectionStates } = useWebSocketSteps();
  const location = useLocation();
  
  const [currentAgent, setCurrentAgent] = useState<any>(null);
  
  // Get module slug from current path
  const moduleSlug = location.pathname.split('/')[1];
  
  const currentStep = steps[activeStep] || null;
  const hasBot = Boolean(currentAgent || currentStep?.bot);
  
  // Load agent for current step dynamically
  useEffect(() => {
    const loadCurrentAgent = async () => {
      if (!currentStep?.botId || !moduleSlug) {
        setCurrentAgent(null);
        return;
      }
      
      try {
        const module = getModuleBySlug(moduleSlug);
        if (!module) {
          setCurrentAgent(null);
          return;
        }
        
        const { Agents } = await module.stepsLoader();
        const agent = Agents.find((a: any) => a.id === currentStep.botId);
        setCurrentAgent(agent || null);
      } catch (error) {
        console.warn('[useChatMessages] Failed to load agent:', error);
        setCurrentAgent(null);
      }
    };

    loadCurrentAgent();
  }, [currentStep?.botId, moduleSlug]);
  
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
  
  // Add detailed connection state logging
  useEffect(() => {
    console.log('[useChatMessages] Connection state details:', {
      activeStep,
      isInitialized,
      isConnected,
      connectionStatesSize: connectionStates.size,
      connectionState: connectionState ? {
        status: connectionState.status,
        stepIndex: connectionState.stepIndex,
        lastActivity: connectionState.lastActivity,
        lastError: connectionState.lastError
      } : null,
      isStepConnected,
      connectionStatusMessage: getConnectionStatusMessage(),
      allConnectionStates: Array.from(connectionStates.entries()).map(([step, state]) => ({
        step,
        status: state.status,
        stepIndex: state.stepIndex,
        lastActivity: state.lastActivity
      }))
    });
  }, [activeStep, isInitialized, isConnected, connectionStates, connectionState, isStepConnected]);

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