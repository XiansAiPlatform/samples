import { useContext } from 'react';
import { DataMessageContext } from '../context/dataMessageTypes';

export const useDataMessage = () => {
  const context = useContext(DataMessageContext);
  if (context === undefined) {
    throw new Error('useDataMessage must be used within a DataMessageProvider');
  }
  return context;
};