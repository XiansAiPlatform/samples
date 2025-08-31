import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SmartToy as AgentIcon } from '@mui/icons-material';
import type { Agent } from '../types';
import { colors } from '../utils/theme';

interface HomePageProps {
  agents: Agent[];
}

const HomePage: React.FC<HomePageProps> = ({ agents }) => {
  const navigate = useNavigate();

  const handleAgentSelect = (agent: Agent) => {
    // Navigate to the agent's first bot if available
    if (agent.bots.length > 0) {
      navigate(`/${agent.slug}/${agent.bots[0].slug}`);
    } else {
      navigate(`/${agent.slug}`);
    }
  };

  return (
    <Box sx={{ 
      maxWidth: '1200px',
      margin: '0 auto',
      p: 4 
    }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" sx={{ 
          fontWeight: 600,
          color: colors.text.primary,
          mb: 2 
        }}>
          Welcome to Agentri Studio
        </Typography>
        <Typography variant="h6" color={colors.text.muted} sx={{ maxWidth: '600px', mx: 'auto' }}>
          Choose an AI assistant to help you with your business needs. Each agent specializes in different areas and workflows.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
        {agents.map((agent) => (
          <Box key={agent.id}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                border: '1px solid #E5E7EB',
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#9CA3AF',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => handleAgentSelect(agent)}
            >
              <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #E5E7EB',
                    mr: 2
                  }}>
                    <AgentIcon sx={{ fontSize: 24, color: '#6B7280' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827', mb: 0.5 }}>
                      {agent.name}
                    </Typography>
                    <Typography variant="body2" color="#6B7280">
                      {agent.description}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 3, flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', mb: 2 }}>
                    Available Bots:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {agent.bots.map((bot) => (
                      <Chip
                        key={bot.id}
                        label={bot.name}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: '#D1D5DB',
                          color: '#6B7280',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.75rem'
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: '#111827',
                    color: '#FFFFFF',
                    fontWeight: 500,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: '#374151'
                    }
                  }}
                >
                  Start Conversation
                </Button>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default HomePage;