import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { Routes, Route, useNavigate } from 'react-router-dom';
import theme from './utils/theme';
import HomePage from './pages/HomePage';
import BotPage from './pages/BotPage';
import Navbar from './components/Navbar';
import type { Agent } from './types';
import { ContractEntityPanel } from './features/legal/components/contract-entity/ContractEntityPanel';
import { DataMessageProvider } from './context/DataMessageContext';
import { AgentProvider } from './context/AgentContext';
import { AuthProvider } from './context/AuthContext';
import { useAgent } from './utils/agentUtils';
import { AuthCallback, SilentCallback, ProtectedRoute } from './components/auth';


// Mock agents data - centralized for the entire app
const agents: Agent[] = [
  {
    id: '1',
    name: 'Legal Department',
    slug: 'legal',
    description: 'Legal analysis and contract management',
    bots: [
      {
        id: 'legal-assistant',
        name: 'Legal Assistant',
        slug: 'assistant',
        description: 'Legal analysis and contract management',
        capabilities: ['Find out the current of the current contract', "Let's work on this contract", "Let's create a new Contract"],
        workflow: 'Legal Contract Agent:Legal Contract Bot',
        mainComponent: ContractEntityPanel,
      },
      {
        id: 'legal-analyzer',
        name: 'Contract Analyzer',
        slug: 'analyzer',
        description: 'Advanced contract analysis and risk assessment',
        capabilities: ['Risk Analysis', 'Compliance Check'],
        workflow: 'Legal Contract Agent:Legal Analysis Bot',
      }
    ],
    flow: 'Legal Contract Agent:Legal Contract Flow',
    enabled: true,
  },
  {
    id: '2',
    name: 'Sales Department',
    slug: 'sales',
    description: 'Sales management and customer relations',
    bots: [
      {
        id: 'sales-assistant',
        name: 'Sales Assistant',
        slug: 'assistant',
        description: 'Helps with orders and customer management',
        capabilities: ['Order Processing', 'Customer Analysis'],
        workflow: 'Sales Agent:Sales Bot',
        mainComponent: ContractEntityPanel,
      }
    ],
    enabled: false,
  },
  {
    id: '3',
    name: 'Finance Department',
    slug: 'finance',
    description: 'Financial analysis and management',
    bots: [
      {
        id: 'finance-advisor',
        name: 'Finance Advisor',
        slug: 'advisor',
        description: 'Financial analysis and invoice management',
        capabilities: ['Invoice Review', 'Financial Analysis'],
        workflow: 'Finance Agent:Finance Bot',
        mainComponent: ContractEntityPanel,
      }
    ],
    enabled: false,
  },
];

// App content component that uses agent context
function AppContent() {
  const navigate = useNavigate();
  const { currentAgent, agents } = useAgent();

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
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#FAFAFA'
    }}>
      <Navbar
        currentAgent={currentAgent || undefined}
        availableAgents={agents}
        onSelectAgent={handleAgentSelect}
      />

      {/* Main Content */}
      <Box sx={{
        flexGrow: 1,
        backgroundColor: '#F9FAFB',
        overflow: 'auto',
        paddingTop: '90px' // Push content below fixed navbar (64px toolbar + 48px py:3 + 1px border)
      }}>
        <Routes>
          <Route
            path="/"
            element={<HomePage agents={agents} />}
          />
          {/* OAuth callback routes */}
          <Route
            path="/auth/callback"
            element={<AuthCallback />}
          />
          <Route
            path="/auth/silent-callback"
            element={<SilentCallback />}
          />
          {/* Agent-level route - shows agent overview or default bot */}
          <Route
            path="/:agentSlug"
            element={
              <ProtectedRoute>
                <BotPage
                  agents={agents}
                  onSelectAgent={handleAgentSelect}
                />
              </ProtectedRoute>
            }
          />
          {/* Specific bot within an agent */}
          <Route
            path="/:agentSlug/:botSlug"
            element={
              <ProtectedRoute>
                <BotPage
                  agents={agents}
                  onSelectAgent={handleAgentSelect}
                />
              </ProtectedRoute>
            }
          />
          {/* New document creation for specific bot */}
          <Route
            path="/:agentSlug/:botSlug/new"
            element={
              <ProtectedRoute>
                <BotPage
                  agents={agents}
                  onSelectAgent={handleAgentSelect}
                />
              </ProtectedRoute>
            }
          />
          {/* Document-specific route for bot */}
          <Route
            path="/:agentSlug/:botSlug/:documentId"
            element={
              <ProtectedRoute>
                <BotPage
                  agents={agents}
                  onSelectAgent={handleAgentSelect}
                />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AgentProvider agents={agents}>
          <DataMessageProvider>
            <AppContent />
          </DataMessageProvider>
        </AgentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
