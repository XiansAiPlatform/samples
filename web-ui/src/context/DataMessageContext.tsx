import React, { useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Message } from '@99xio/xians-sdk-typescript';
import type { DataMessagePayload, DataMessageHandler, DataMessageContextType } from './dataMessageTypes';
import { DataMessageContext } from './dataMessageTypes';

// Type for message data with camelCase properties
interface MessageDataWithSubject {
  messageSubject?: string;
  data?: unknown;
  [key: string]: unknown;
}

interface DataMessageProviderProps {
  children: ReactNode;
}

export const DataMessageProvider: React.FC<DataMessageProviderProps> = ({ children }) => {
  const subscriptionsRef = useRef<Map<string, Set<DataMessageHandler>>>(new Map());

  const subscribe = useCallback((messageSubject: string, handler: DataMessageHandler) => {
    if (!subscriptionsRef.current.has(messageSubject)) {
      subscriptionsRef.current.set(messageSubject, new Set());
    }
    
    subscriptionsRef.current.get(messageSubject)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = subscriptionsRef.current.get(messageSubject);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          subscriptionsRef.current.delete(messageSubject);
        }
      }
    };
  }, []);

  const publish = useCallback((message: Message) => {
    // Extract messageSubject from message data (camelCase)
    if (message.data && typeof message.data === 'object') {
      const messageData = message.data as MessageDataWithSubject;
      const messageSubject = messageData.messageSubject;
      
      if (messageSubject) {
        const handlers = subscriptionsRef.current.get(messageSubject);
        
        if (handlers) {
          const payload: DataMessagePayload = {
            messageSubject,
            data: messageData.data || message.data,
            message
          };
          
          console.log(`[DataMessageProvider] Publishing ${messageSubject} to ${handlers.size} handler(s)`);
          
          handlers.forEach(handler => {
            try {
              handler(payload);
            } catch (error) {
              console.error(`[DataMessageProvider] Error in handler for ${messageSubject}:`, error);
            }
          });
        } else {
          console.log(`[DataMessageProvider] No handlers for messageSubject: ${messageSubject}`);
        }
      } else {
        console.log(`[DataMessageProvider] Data message received but no messageSubject found:`, message);
        console.log(`[DataMessageProvider] Message data structure:`, message.data);
      }
    } else {
      console.log(`[DataMessageProvider] Data message received but no data object found:`, message);
    }
  }, []);

  const value: DataMessageContextType = {
    subscribe,
    publish
  };

  return (
    <DataMessageContext.Provider value={value}>
      {children}
    </DataMessageContext.Provider>
  );
};

