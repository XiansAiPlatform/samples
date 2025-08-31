import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  TextField,
  IconButton,
} from '@mui/material';
import {
  Send as SendIcon,
} from '@mui/icons-material';
import type { Bot } from '../../types';
import { colors } from '../../utils/theme';

interface MessageInputProps {
  messageInput: string;
  setMessageInput: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  isConnected: boolean;
  currentAgent?: Bot | null;
}

export interface MessageInputRef {
  focusInput: () => void;
}

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({
  messageInput,
  setMessageInput,
  onSendMessage,
  onKeyPress,
  isLoading,
  isConnected,
  currentAgent,
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      inputRef.current?.focus();
    }
  }));

  const handleSendClick = () => {
    onSendMessage();
  };
  return (
    <Box sx={{ 
      p: 1, 
              borderTop: `1px solid ${colors.border.primary}`,
      backgroundColor: colors.surface.primary,
      flexShrink: 0 // Prevent input area from shrinking
    }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          size="small"
          placeholder={`Message ${currentAgent?.name || 'AI Assistant'}...`}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={onKeyPress}
          disabled={isLoading}
          inputRef={inputRef}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: colors.surface.primary,
              borderRadius: 2,
              minHeight: 36, // Reduced from 44 to 36
              '& fieldset': {
                borderColor: colors.border.secondary,
              },
              '&:hover fieldset': {
                borderColor: colors.text.placeholder,
              },
              '&.Mui-focused fieldset': {
                borderColor: colors.text.muted,
              },
            },
            '& .MuiInputBase-input': {
              padding: '8px 12px', // Reduced from 12px 14px
            }
          }}
        />
        <IconButton
          onClick={handleSendClick}
          disabled={!messageInput.trim() || isLoading || !isConnected}
          sx={{
            bgcolor: (messageInput.trim() && isConnected && !isLoading) ? colors.slate[700] : colors.slate[100],
            color: (messageInput.trim() && isConnected && !isLoading) ? colors.text.inverse : colors.text.placeholder,
            borderRadius: 2,
            width: 36,
            height: 36,
            '&:hover': {
              bgcolor: (messageInput.trim() && isConnected && !isLoading) ? colors.slate[800] : colors.border.primary,
            },
            '&:disabled': {
              bgcolor: colors.slate[100],
              color: colors.text.placeholder,
            }
          }}
        >
          <SendIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;