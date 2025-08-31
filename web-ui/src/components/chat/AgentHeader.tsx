import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Circle as StatusIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import type { Bot } from '../../types';

interface AgentHeaderProps {
  currentAgent: Bot;
  isConnected: boolean;
  forceExpanded?: boolean;
  onCapabilityClick?: (capability: string) => void;
}

const AgentHeader: React.FC<AgentHeaderProps> = ({
  currentAgent,
  isConnected,
  forceExpanded = false,
  onCapabilityClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Use forceExpanded prop to override internal state
  const shouldShowExpanded = forceExpanded || isExpanded;

  // Handle clicks outside the header to collapse it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only collapse if manually expanded (not forceExpanded) and clicking outside
      if (!forceExpanded && isExpanded && headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    // Add event listener only when expanded and not forceExpanded
    if (!forceExpanded && isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, forceExpanded]);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCapabilityClick = (capability: string) => {
    // Collapse header if it's manually expanded (not forceExpanded)
    if (!forceExpanded && isExpanded) {
      setIsExpanded(false);
    }

    if (onCapabilityClick) {
      onCapabilityClick(capability);
    } else {
      // Default behavior: send message using window.dispatchEvent
      const sendChatEvent = new CustomEvent('SendChat', {
        detail: {
          message: capability
        }
      });
      window.dispatchEvent(sendChatEvent);
    }
  };

  return (
    <Box 
      ref={headerRef}
      sx={{ 
        p: { xs: shouldShowExpanded ? 2 : 1.5, sm: shouldShowExpanded ? 3 : 2 }, 
        backgroundColor: shouldShowExpanded ? 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' : '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        flexShrink: 0, // Prevent header from shrinking
        transition: 'all 0.3s ease-in-out'
      }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: shouldShowExpanded ? 'flex-start' : 'center', 
        gap: { xs: 1.5, sm: 2 },
        flexDirection: { xs: shouldShowExpanded ? 'column' : 'row', sm: 'row' }
      }}>
        <Box sx={{
          width: { xs: shouldShowExpanded ? 48 : 40, sm: shouldShowExpanded ? 56 : 48 },
          height: { xs: shouldShowExpanded ? 48 : 40, sm: shouldShowExpanded ? 56 : 48 },
          borderRadius: shouldShowExpanded ? 3 : 2,
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #E5E7EB',
          boxShadow: shouldShowExpanded 
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease-in-out',
          alignSelf: { xs: shouldShowExpanded ? 'center' : 'flex-start', sm: 'flex-start' }
        }}>
          <AgentIcon sx={{ 
            fontSize: { xs: shouldShowExpanded ? 20 : 18, sm: shouldShowExpanded ? 24 : 20 }, 
            color: '#6B7280',
            transition: 'all 0.3s ease-in-out'
          }} />
        </Box>
        
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: shouldShowExpanded ? 1 : 0.5 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: '#111827',
              fontSize: shouldShowExpanded ? '1.25rem' : '1.1rem',
              transition: 'all 0.3s ease-in-out'
            }}>
              {currentAgent.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StatusIcon sx={{ 
                fontSize: shouldShowExpanded ? 10 : 8, 
                color: isConnected ? '#10B981' : '#EF4444',
                transition: 'all 0.3s ease-in-out'
              }} />
              <Typography variant="caption" sx={{ 
                color: isConnected ? '#10B981' : '#EF4444',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: shouldShowExpanded ? '0.75rem' : '0.7rem'
              }}>
                {isConnected ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body2" color="#6B7280" sx={{ 
            mb: shouldShowExpanded ? 1.5 : 0.5,
            lineHeight: 1.4,
            fontSize: shouldShowExpanded ? '0.9rem' : '0.85rem',
            transition: 'all 0.3s ease-in-out'
          }}>
            {currentAgent.description}
          </Typography>
          
          <Collapse in={shouldShowExpanded}>
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ 
                color: '#374151',
                fontWeight: 600,
                mb: 1.5,
                fontSize: '0.875rem',
                letterSpacing: '0.025em'
              }}>
                Available Capabilities
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 1
              }}>
                {currentAgent.capabilities.map((capability) => (
                  <Box
                    key={capability}
                    onClick={() => handleCapabilityClick(capability)}
                    sx={{ 
                      p: { xs: 1, sm: 1.5 },
                      borderRadius: 2,
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      '&:hover': {
                        borderColor: '#3B82F6',
                        backgroundColor: '#F8FAFC',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        transform: 'translateY(-1px)'
                      },
                      '@media (max-width: 600px)': {
                        '&:hover': {
                          transform: 'none' // Disable hover animations on mobile
                        }
                      }
                    }}
                  >
                    <Box sx={{
                      width: { xs: 20, sm: 24 },
                      height: { xs: 20, sm: 24 },
                      borderRadius: '50%',
                      backgroundColor: '#3B82F6',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ChatIcon sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }} />
                    </Box>
                    <Typography sx={{ 
                      color: '#374151',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      fontWeight: 500,
                      lineHeight: 1.4,
                      wordBreak: 'break-word' // Handle long capability names
                    }}>
                      {capability}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Collapse>
        </Box>
        
        {!forceExpanded && (
          <IconButton
            onClick={handleToggleExpanded}
            size="small"
            sx={{
              color: '#6B7280',
              mt: shouldShowExpanded ? 0.5 : 0,
              '&:hover': {
                backgroundColor: '#F3F4F6',
                color: '#374151'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default AgentHeader;