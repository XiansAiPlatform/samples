import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ChatBubbleOutline as ChatIcon,
} from '@mui/icons-material';
import type { ContractValidation } from '../../../../types';

interface ValidationAlertProps {
  validation: ContractValidation;
  onAskAgent?: (prompt: string) => void;
}

const getSeverityIcon = (severity: number, iconColor: string) => {
  const iconProps = { sx: { fontSize: 18, color: iconColor } };
  switch (severity) {
    case 0: return <ErrorIcon {...iconProps} />;
    case 1: return <WarningIcon {...iconProps} />;
    case 2: return <InfoIcon {...iconProps} />;
    default: return <InfoIcon {...iconProps} />;
  }
};

const getSeverityColors = (severity: number) => {
  switch (severity) {
    case 0: return {
      borderColor: '#E5E7EB',
      backgroundColor: '#FEFEFE',
      iconColor: '#DC2626',
      iconBackground: '#FEF2F2',
      textColor: '#374151'
    };
    case 1: return {
      borderColor: '#E5E7EB',
      backgroundColor: '#FEFEFE',
      iconColor: '#D97706',
      iconBackground: '#FFFBEB',
      textColor: '#374151'
    };
    case 2: return {
      borderColor: '#E5E7EB',
      backgroundColor: '#FEFEFE',
      iconColor: '#2563EB',
      iconBackground: '#EFF6FF',
      textColor: '#374151'
    };
    default: return {
      borderColor: '#E5E7EB',
      backgroundColor: '#FEFEFE',
      iconColor: '#2563EB',
      iconBackground: '#EFF6FF',
      textColor: '#374151'
    };
  }
};

export const ValidationAlert: React.FC<ValidationAlertProps> = ({ 
  validation, 
  onAskAgent 
}) => {
  const colors = getSeverityColors(validation.severity);

  const handleAskAgent = () => {
    if (validation.prompt && onAskAgent) {
      onAskAgent(validation.prompt);
    }
  };

  return (
    <Box sx={{
      mt: 1,
      p: 1.5,
      borderRadius: 1,
      border: '1px solid',
      borderColor: colors.borderColor,
      backgroundColor: colors.backgroundColor,
      position: 'relative',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {/* Severity Icon */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 1,
          backgroundColor: colors.iconBackground,
          flexShrink: 0,
          mt: 0
        }}>
          {getSeverityIcon(validation.severity, colors.iconColor)}
        </Box>
        
        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Main Message */}
          <Typography variant="body2" sx={{ 
            fontWeight: 400, 
            color: colors.textColor,
            lineHeight: 1.4,
            fontSize: '0.875rem',
            mb: validation.suggestedAction || validation.prompt ? 0.75 : 0
          }}>
            {validation.message}
          </Typography>
          
          {/* Suggested Action */}
          {validation.suggestedAction && (
            <Box sx={{ mb: validation.prompt ? 0.75 : 0 }}>
              <Typography variant="caption" sx={{ 
                display: 'block',
                color: '#6B7280',
                lineHeight: 1.3,
                backgroundColor: '#F9FAFB',
                px: 1.5,
                py: 0.5,
                borderRadius: 0.5,
                fontSize: '0.75rem',
                fontStyle: 'italic'
              }}>
                {validation.suggestedAction}
              </Typography>
            </Box>
          )}

          {/* Ask Agent Button */}
          {validation.prompt && onAskAgent && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
              <Button
                variant="text"
                size="small"
                startIcon={<ChatIcon sx={{ fontSize: 14 }} />}
                onClick={handleAskAgent}
                sx={{
                  textTransform: 'none',
                  color: '#6B7280',
                  backgroundColor: 'transparent',
                  minWidth: 'auto',
                  borderRadius: 0.5,
                  fontWeight: 400,
                  fontSize: '0.75rem',
                  px: 1,
                  py: 0.25,
                  '&:hover': {
                    color: '#374151',
                    backgroundColor: '#F3F4F6',
                  },
                  transition: 'all 0.15s ease-in-out'
                }}
              >
                Ask Agent
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ValidationAlert;