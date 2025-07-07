import { useContext } from 'react';
import { WebSocketStepsContext } from './WebSocketStepsContext';
import { WebSocketStepsContextType } from './types';

export const useWebSocketSteps = (): WebSocketStepsContextType => {
  const context = useContext(WebSocketStepsContext);
  if (!context) {
    throw new Error('useWebSocketSteps must be used within WebSocketStepsProvider');
  }
  return context;
}; 