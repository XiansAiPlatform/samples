import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { StepsProvider } from './context/StepsContext';
import { WebSocketStepsProvider } from './context/websocket/WebSocketStepsContext';
import { AppRoutes } from './routing';

const App: React.FC = () => (
  <SettingsProvider>
    <Router>
      <StepsProvider>
        <WebSocketStepsProvider>
          <AppRoutes />
        </WebSocketStepsProvider>
      </StepsProvider>
    </Router>
  </SettingsProvider>
);

export default App;