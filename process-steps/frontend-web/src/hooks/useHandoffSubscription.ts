import { useEffect, useState, useCallback } from 'react';
import { useWebSocketSteps } from '../context/WebSocketStepsContext';
import { type HandoffMessage } from '@99xio/xians-sdk-typescript';

export interface HandoffSubscriptionOptions {
  onHandoff?: (handoff: HandoffMessage) => void;
  enabled?: boolean;
}

/**
 * Custom hook for subscribing specifically to handoff messages
 * This demonstrates the clean separation of concerns with dedicated handoff handling
 */
export function useHandoffSubscription(options: HandoffSubscriptionOptions = {}) {
  const { subscribeToHandoffs } = useWebSocketSteps();
  const [handoffs, setHandoffs] = useState<HandoffMessage[]>([]);
  const [latestHandoff, setLatestHandoff] = useState<HandoffMessage | null>(null);

  const handleHandoff = useCallback((handoff: HandoffMessage) => {
    setHandoffs(prev => [...prev, handoff]);
    setLatestHandoff(handoff);
    
    // Call external callback if provided
    options.onHandoff?.(handoff);
  }, [options.onHandoff]);

  useEffect(() => {
    if (options.enabled === false) return;
    
    console.log('[useHandoffSubscription] Subscribing to handoff messages');
    
    const unsubscribe = subscribeToHandoffs(handleHandoff);

    return () => {
      console.log('[useHandoffSubscription] Unsubscribing from handoff messages');
      unsubscribe();
    };
  }, [subscribeToHandoffs, handleHandoff, options.enabled]);

  const clearHandoffs = useCallback(() => {
    setHandoffs([]);
    setLatestHandoff(null);
  }, []);

  return {
    handoffs,
    latestHandoff,
    clearHandoffs,
    handoffCount: handoffs.length
  };
}

/**
 * Hook specifically for monitoring handoff events for debugging/analytics
 */
export function useHandoffMonitor() {
  return useHandoffSubscription({
    onHandoff: (handoff) => {
      console.log('[HandoffMonitor] Handoff detected:', {
        workflowId: handoff.workflowId,
        text: handoff.text,
        timestamp: handoff.timestamp,
        isHistorical: handoff.isHistorical
      });
    }
  });
} 