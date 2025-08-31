import React from 'react';
import {
  Box,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
} from '@mui/icons-material';

interface ErrorAlertProps {
  error: string | null;
  onClose: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onClose,
}) => {
  if (!error) return null;

  return (
    <Box sx={{ p: 2, flexShrink: 0 }}>
      <Alert 
        severity="error" 
        icon={<WarningIcon />}
        onClose={onClose}
      >
        {error}
      </Alert>
    </Box>
  );
};

export default ErrorAlert;