import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Fade,
} from '@mui/material';
import { colors } from '../../utils/theme';

interface TypingIndicatorProps {
  isVisible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
}) => {
  const [showIndicator, setShowIndicator] = useState(false);
  const [message, setMessage] = useState('Connecting to agent...');

  useEffect(() => {
    let connectingTimer: number;
    let hideTimer: number;

    if (isVisible) {
      setShowIndicator(true);
      setMessage('Connecting to agent...');

      // After 2 seconds, change to "Waiting for response..."
      connectingTimer = setTimeout(() => {
        setMessage('Waiting for response...');
      }, 2000);

      // After 30 seconds total, hide the indicator
      hideTimer = setTimeout(() => {
        setShowIndicator(false);
      }, 30000);
    } else {
      // Hide immediately when isVisible becomes false
      setShowIndicator(false);
    }

    return () => {
      clearTimeout(connectingTimer);
      clearTimeout(hideTimer);
    };
  }, [isVisible]);

  // Reset state when indicator is hidden
  useEffect(() => {
    if (!showIndicator && !isVisible) {
      setMessage('Connecting to agent...');
    }
  }, [showIndicator, isVisible]);
  return (
    <Fade in={showIndicator}>
      <Box
        sx={{
          display: showIndicator ? 'flex' : 'none',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          mx: 0,
          mt: 0.5,
          mb: 0,
          borderRadius: 0,
          backgroundColor: colors.surface.secondary,
          border: `1px solid ${colors.border.secondary}`,
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {/* Animated typing dots */}
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: colors.text.muted,
                animation: 'typing-dot 1.4s infinite ease-in-out',
                animationDelay: `${index * 0.2}s`,
                '@keyframes typing-dot': {
                  '0%, 80%, 100%': {
                    opacity: 0.3,
                    transform: 'scale(0.8)',
                  },
                  '40%': {
                    opacity: 1,
                    transform: 'scale(1)',
                  },
                },
              }}
            />
          ))}
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: colors.text.muted,
            fontSize: '0.875rem',
            fontStyle: 'italic',
          }}
        >
          {message}
        </Typography>
      </Box>
    </Fade>
  );
};

export default TypingIndicator;