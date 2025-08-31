import { createContext } from 'react';
import type { Message } from '@99xio/xians-sdk-typescript';

// Data Message Types
export interface DataMessagePayload {
  messageSubject: string;
  data: unknown;
  message: Message; // Full message object for additional context
}

export type DataMessageHandler = (payload: DataMessagePayload) => void;

export interface DataMessageContextType {
  subscribe: (messageSubject: string, handler: DataMessageHandler) => () => void;
  publish: (message: Message) => void;
}

export const DataMessageContext = createContext<DataMessageContextType | undefined>(undefined);