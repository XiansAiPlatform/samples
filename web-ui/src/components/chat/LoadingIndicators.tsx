import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';

interface LoadingIndicatorsProps {
  isLoading: boolean;
  isConnected: boolean;
  isLoadingHistory: boolean;
}

const LoadingIndicators: React.FC<LoadingIndicatorsProps> = ({
  isLoading,
  isConnected,
  isLoadingHistory,
}) => {
  return (
    <>
      {/* Connection Loading Indicator */}
      {isLoading && !isConnected && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 3,
          borderBottom: '1px solid #E5E7EB',
          flexShrink: 0
        }}>
          <CircularProgress size={20} sx={{ mr: 2 }} />
          <Typography variant="body2" color="#6B7280">
            Connecting to chat service...
          </Typography>
        </Box>
      )}

      {/* History Loading Indicator */}
      {isLoadingHistory && isConnected && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 3,
          borderBottom: '1px solid #E5E7EB',
          flexShrink: 0
        }}>
          <CircularProgress size={20} sx={{ mr: 2 }} />
          <Typography variant="body2" color="#6B7280">
            Loading conversation history...
          </Typography>
        </Box>
      )}
    </>
  );
};

export default LoadingIndicators;