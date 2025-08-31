import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  SmartToy as AgentIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Add as AddIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import type { Agent } from '../types';
import { colors } from '../utils/theme';
import { useAuthActions } from '../hooks/useAuth';

interface NavbarProps {
  currentAgent?: Agent;
  availableAgents?: Agent[];
  onSelectAgent?: (agent: Agent) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  currentAgent,
  availableAgents = [],
  onSelectAgent,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, login, logout } = useAuthActions();
  const [agentMenuAnchorEl, setAgentMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const shouldShowAgentSelector = availableAgents.length > 0; // Always show if agents are available
  const shouldShowNewButton = true; // Always show new button

  const handleAgentMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAgentMenuAnchorEl(event.currentTarget);
  };

  const handleAgentMenuClose = () => {
    setAgentMenuAnchorEl(null);
  };

  const handleAgentSelect = (agent: Agent) => {
    if (onSelectAgent) {
      onSelectAgent(agent);
    }
    handleAgentMenuClose();
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  const handleNewClick = () => {
    if (currentAgent?.slug) {
      // Navigate to the agent's first bot with /new
      if (currentAgent.bots.length > 0) {
        navigate(`/${currentAgent.slug}/${currentAgent.bots[0].slug}/new`);
      } else {
        navigate(`/${currentAgent.slug}/new`);
      }
    } else {
      // If no agent is selected, navigate to first available agent's first bot
      if (availableAgents.length > 0) {
        const firstAgent = availableAgents[0];
        if (firstAgent.bots.length > 0) {
          navigate(`/${firstAgent.slug}/${firstAgent.bots[0].slug}/new`);
        } else {
          navigate(`/${firstAgent.slug}/new`);
        }
      } else {
        navigate('/new');
      }
    }
  };

  return (
    <AppBar position="fixed" elevation={0} sx={{
      backgroundColor: 'background.paper',
      borderBottom: `1px solid ${colors.border.primary}`,
      zIndex: (theme) => theme.zIndex.drawer + 1
    }}>
      <Box sx={{ 
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%',
        px: { xs: 4, sm: 5 } 
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: 0, py: 3 }}>
          {/* Left side - Logo and Agent Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography 
              variant="h5" 
              component="div" 
              onClick={() => navigate('/')}
              sx={{ 
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: '#111827',
                cursor: 'pointer',
                '&:hover': {
                  color: '#374151'
                }
              }}
            >
              Agentri Studio
            </Typography>

            {/* Agent Selector - Shown when current agent exists or on new route */}
            {shouldShowAgentSelector && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  onClick={handleAgentMenuClick}
                  endIcon={<ArrowDownIcon />}
                  sx={{
                    px: 3,
                    py: 1.5,
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #D1D5DB',
                    borderRadius: 1.5,
                    textTransform: 'none',
                    color: '#374151',
                    '&:hover': {
                      backgroundColor: '#F3F4F6',
                      borderColor: '#9CA3AF',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AgentIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.primary }}>
                        {currentAgent ? currentAgent.name : 'Select Agent'}
                      </Typography>
                    </Box>
                  </Box>
                </Button>

                <Menu
                  anchorEl={agentMenuAnchorEl}
                  open={Boolean(agentMenuAnchorEl)}
                  onClose={handleAgentMenuClose}
                  sx={{
                    '& .MuiPaper-root': {
                      mt: 1,
                      borderRadius: 2,
                      minWidth: 300,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #E5E7EB',
                    }
                  }}
                >
                  {availableAgents.map((agent) => (
                    <MenuItem 
                      key={agent.id} 
                      onClick={() => handleAgentSelect(agent)}
                      selected={agent.id === currentAgent?.id}
                      sx={{ 
                        py: 2.5, 
                        px: 3,
                        '&.Mui-selected': {
                          backgroundColor: '#F9FAFB',
                        },
                        '&:hover': {
                          backgroundColor: '#F3F4F6',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, width: '100%' }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          backgroundColor: '#F3F4F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #E5E7EB'
                        }}>
                          <AgentIcon sx={{ fontSize: 20, color: '#6B7280' }} />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: colors.text.primary }}>
                            {agent.name}
                          </Typography>
                          <Typography variant="caption" color={colors.text.muted} sx={{ display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                            {agent.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {agent.bots.slice(0, 2).map((bot) => (
                              <Chip
                                key={bot.id}
                                label={bot.name}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  height: 22,
                                  fontSize: '0.7rem',
                                  borderColor: '#D1D5DB',
                                  color: '#6B7280',
                                  backgroundColor: '#FFFFFF',
                                  '& .MuiChip-label': {
                                    px: 1.5
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            )}
          </Box>
          
          {/* Right side - New button and User controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* New button */}
            {shouldShowNewButton && (
              <Button
                onClick={handleNewClick}
                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                variant="outlined"
                sx={{
                  px: 3,
                  py: 1.5,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  color: '#374151',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: '#F9FAFB',
                    borderColor: '#9CA3AF',
                    color: '#111827',
                  },
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                  mr: 2,
                }}
              >
                New
              </Button>
            )}
            <IconButton 
              color="inherit" 
              size="small"
              sx={{ 
                color: '#6B7280',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                '&:hover': { 
                  backgroundColor: '#F9FAFB',
                  borderColor: '#D1D5DB',
                  color: '#374151'
                }
              }}
            >
              <NotificationsIcon />
            </IconButton>
            <IconButton 
              color="inherit" 
              size="small"
              sx={{ 
                color: '#6B7280',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                '&:hover': { 
                  backgroundColor: '#F9FAFB',
                  borderColor: '#D1D5DB',
                  color: '#374151'
                }
              }}
            >
              <SettingsIcon />
            </IconButton>
            {/* Authentication UI */}
            {isAuthenticated && user ? (
              <>
                <Avatar 
                  onClick={handleUserMenuClick}
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: colors.text.muted,
                    ml: 2,
                    fontWeight: 500,
                    border: `2px solid ${colors.surface.primary}`,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    color: colors.text.inverse,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                  src={user.profile?.picture}
                >
                  {user.profile?.given_name?.[0] || user.profile?.name?.[0] || 'U'}
                </Avatar>
                <Menu
                  anchorEl={userMenuAnchorEl}
                  open={Boolean(userMenuAnchorEl)}
                  onClose={handleUserMenuClose}
                  sx={{
                    '& .MuiPaper-root': {
                      mt: 1,
                      borderRadius: 2,
                      minWidth: 200,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #E5E7EB',
                    }
                  }}
                >
                  <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #E5E7EB' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.primary }}>
                      {user.profile?.name || user.profile?.email}
                    </Typography>
                    <Typography variant="caption" color={colors.text.muted}>
                      {user.profile?.email}
                    </Typography>
                  </Box>
                  <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 3 }}>
                    <LogoutIcon sx={{ mr: 2, fontSize: 18 }} />
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                onClick={handleLogin}
                startIcon={<LoginIcon sx={{ fontSize: 18 }} />}
                variant="contained"
                sx={{
                  px: 3,
                  py: 1.5,
                  ml: 2,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </Box>
    </AppBar>
  );
};

export default Navbar;