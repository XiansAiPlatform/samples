import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  ListItem,
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../../types';
import { colors } from '../../utils/theme';
import UIComponentRenderer, { type UIComponentRef } from '../../features/legal/components/chat-components/ComponentRegistry';

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <ListItem
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
        mb: 1.5, // Reduced from 2 to 1.5 for tighter spacing
        px: 0,
        py: 0,
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2.5,
        maxWidth: '92%', // Increased from 85% to 92% for wider messages
        flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
      }}>
        <Avatar sx={{ 
          width: 36, 
          height: 36,
          bgcolor: message.sender === 'agent' ? colors.text.muted : colors.slate[700]
        }}>
          {message.sender === 'agent' ? <AgentIcon /> : <PersonIcon />}
        </Avatar>
        
        <Box
          sx={{
            px: 2.5, // Reduced from 3.5 to 2.5 for more content space
            py: 2, // Reduced from 2.5 to 2
            backgroundColor: message.sender === 'user' 
              ? colors.slate[700] 
              : colors.surface.muted,
            color: message.sender === 'user' 
              ? colors.text.inverse 
              : colors.text.primary,
            borderRadius: 3,
            border: message.sender === 'agent' ? `1px solid ${colors.border.primary}` : 'none',
            maxWidth: '100%',
            boxShadow: message.sender === 'user' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' 
              : 'none',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            '& p': {
              margin: '0 0 1em 0',
              '&:last-child': {
                marginBottom: 0,
              },
            },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              margin: '1em 0 0.5em 0',
              fontWeight: 600,
              '&:first-of-type': {
                marginTop: 0,
              },
            },
            '& h1': { fontSize: '1.5em' },
            '& h2': { fontSize: '1.3em' },
            '& h3': { fontSize: '1.1em' },
            '& ul, & ol': {
              margin: '0.5em 0',
              paddingLeft: '1.5em',
            },
            '& li': {
              margin: '0.25em 0',
            },
            '& code': {
              backgroundColor: message.sender === 'user' ? 'rgba(255, 255, 255, 0.1)' : colors.gray[100],
              padding: '0.125em 0.25em',
              borderRadius: '0.25em',
              fontSize: '0.875em',
              fontFamily: 'monospace',
            },
            '& pre': {
              backgroundColor: message.sender === 'user' ? 'rgba(255, 255, 255, 0.1)' : colors.gray[100],
              padding: '1em',
              borderRadius: '0.5em',
              overflow: 'auto',
              margin: '0.5em 0',
              '& code': {
                backgroundColor: 'transparent',
                padding: 0,
              },
            },
            '& blockquote': {
              borderLeft: `3px solid ${message.sender === 'user' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'}`,
              paddingLeft: '1em',
              margin: '0.5em 0',
              fontStyle: 'italic',
            },
            '& strong': {
              fontWeight: 600,
            },
            '& em': {
              fontStyle: 'italic',
            },
          }}
        >
          {message.metadata?.isUIComponent && message.metadata?.uiComponentData ? (
            <UIComponentRenderer data={message.metadata.uiComponentData as UIComponentRef} />
          ) : (
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          )}
        </Box>
      </Box>
      
      <Typography 
        variant="caption" 
        color="#9CA3AF"
        sx={{ 
          mt: 1.5,
          alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
          mr: message.sender === 'user' ? 6 : 0,
          ml: message.sender === 'agent' ? 6 : 0,
        }}
      >
        {message.timestamp.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Typography>
    </ListItem>
  );
};

export default ChatMessageComponent;