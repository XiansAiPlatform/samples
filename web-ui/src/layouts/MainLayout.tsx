import React from 'react';
import {
  Box,
} from '@mui/material';
import { colors } from '../utils/theme';

interface MainLayoutProps {
  children?: React.ReactNode;
  chatPanel: React.ReactNode;
  agentComponent?: React.ReactNode; // Optional dynamic agent component
}

const MainLayout: React.FC<MainLayoutProps> = ({
  chatPanel,
  agentComponent,
}) => {
  // If no agent component, render chat-only centered layout
  if (!agentComponent) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: colors.surface.muted
      }}>
        {/* Main Content Area - Chat with reduced top spacing */}
        <Box sx={{ 
          flexGrow: 1, 
          width: '100%',
          backgroundColor: colors.surface.muted,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          pt: { xs: 3, sm: 4 }
        }}>
          <Box 
            sx={{ 
              width: '100%',
              maxWidth: '1000px', // Increased from 800px to 1000px for wider chat panel
              height: 'calc(100% - 100px)', // Adjust height to account for padding
              maxHeight: '700px',
              px: { xs: 2, sm: 4 },
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Centered Chat Panel */}
            <Box sx={{ 
              flexGrow: 1,
              backgroundColor: colors.surface.primary,
              borderRadius: 2,
              border: `1px solid ${colors.border.primary}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
            }}>
              {chatPanel}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Render full two-column layout
  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
              backgroundColor: colors.surface.muted
    }}>
      {/* Enhanced Main Content Area */}
      <Box sx={{ 
        flexGrow: 1, 
        width: '100%',
        backgroundColor: '#F9FAFB'
      }}>
        <Box 
          sx={{ 
            maxWidth: '1440px',
            margin: '0 auto',
            width: '100%',
            px: { xs: 4, sm: 5 },
            py: { xs: 4, sm: 5 },
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 4, sm: 5 }, 
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'flex-start' }
          }}>
            {/* Enhanced Chat Panel */}
            <Box sx={{ 
              flex: { xs: '1', md: '0 0 550px' }, // Increased from 420px to 550px for wider chat panel
              height: { xs: '500px', md: 'calc(100vh - 170px)' }, // Fixed height: 100vh - 90px navbar - 40px top padding - 40px bottom padding
              maxHeight: { xs: '500px', md: 'calc(100vh - 170px)' }, // Ensure it never exceeds viewport
              display: 'flex',
              flexDirection: 'column',
              position: { md: 'sticky' },
              top: { md: '40px' } // Negative top padding to immediately stick to navbar edge
            }}>
              <Box sx={{ 
                flexGrow: 1,
                backgroundColor: colors.surface.primary,
                borderRadius: 2,
                border: `1px solid ${colors.border.primary}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
              }}>
                {chatPanel}
              </Box>
            </Box>

            {/* Agent Component Panel */}
            <Box sx={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column'
              }}>
                {agentComponent}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout; 