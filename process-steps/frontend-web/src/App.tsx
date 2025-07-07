import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import NavBar from './components/NavBar';
import StepsBar from './components/StepsBar';
import { 
  ChatPane, 
  CollapsedChatButton, 
  MobileChatOverlay, 
  MobileChatButton 
} from './components/chat';
import EntityPane from './components/EntityPane';
import { 
  FindingsPane, 
  CollapsedFindingsButton, 
  MobileFindingsOverlay, 
  MobileFindingsButton,
  Finding 
} from './components/findings';
import { StepsProvider } from './context/StepsContext';
import { SettingsProvider } from './context/SettingsContext';
import { WebSocketStepsProvider } from './context/WebSocketStepsContext';
import { EntityProvider } from './context/EntityContext';
import { modules } from './modules/modules';
import DynamicModuleRoute from './modules/components/DynamicModuleRoute';

const MainLayout: React.FC = () => {
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [mobileFindingsOpen, setMobileFindingsOpen] = useState(false);
  const [findingsPaneCollapsed, setFindingsPaneCollapsed] = useState(false);
  const [chatPaneCollapsed, setChatPaneCollapsed] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);

  // Calculate entity pane flex based on collapsed states
  const getEntityFlexClass = () => {
    if (chatPaneCollapsed && findingsPaneCollapsed) return 'flex-[4]'; // Both collapsed
    if (chatPaneCollapsed || findingsPaneCollapsed) return 'flex-[2.5]'; // One collapsed
    return 'flex-[1.5]'; // None collapsed
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top navigation */}
      <NavBar />

      {/* Steps / Areas of work */}
      <StepsBar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsed chat pane button - desktop only */}
        {chatPaneCollapsed && (
          <CollapsedChatButton
            onExpand={() => setChatPaneCollapsed(false)}
          />
        )}

        {/* Chat pane - desktop only */}
        {!chatPaneCollapsed && (
          <div className="hidden sm:block min-w-[280px] flex-1 border-r border-gray-200 overflow-hidden">
            <ChatPane 
              isCollapsed={chatPaneCollapsed}
              onToggleCollapse={setChatPaneCollapsed}
            />
          </div>
        )}

        {/* Entity state pane */}
        <div
          className={`overflow-hidden transition-all duration-300 ${getEntityFlexClass()}`}
          onClick={() => {
            setMobileChatOpen(false);
            setMobileFindingsOpen(false);
          }}
        >
          <EntityPane />
        </div>

        {/* Findings pane - desktop only */}
        {!findingsPaneCollapsed && (
          <div className="hidden sm:block min-w-[280px] flex-1 border-l border-gray-200 overflow-hidden">
            <FindingsPane 
              isCollapsed={findingsPaneCollapsed}
              onToggleCollapse={setFindingsPaneCollapsed}
              onFindingsChange={setFindings}
            />
          </div>
        )}

        {/* Collapsed findings pane button - desktop only */}
        {findingsPaneCollapsed && (
          <CollapsedFindingsButton
            findings={findings}
            onExpand={() => setFindingsPaneCollapsed(false)}
          />
        )}
      </div>

      {/* Mobile chat overlay */}
      <MobileChatOverlay
        isOpen={mobileChatOpen}
        onClose={() => setMobileChatOpen(false)}
      />

      {/* Mobile findings overlay */}
      <MobileFindingsOverlay
        isOpen={mobileFindingsOpen}
        onClose={() => setMobileFindingsOpen(false)}
        findings={findings}
        onFindingsChange={setFindings}
      />

      {/* Mobile chat button */}
      <MobileChatButton
        isOpen={mobileChatOpen}
        onOpen={() => setMobileChatOpen(true)}
      />

      {/* Mobile findings button */}
      <MobileFindingsButton
        isOpen={mobileFindingsOpen}
        onOpen={() => setMobileFindingsOpen(true)}
      />
    </div>
  );
};

const ModuleWorkflow: React.FC = () => (
  <EntityProvider>
    <MainLayout />
  </EntityProvider>
);

const App: React.FC = () => (
  <SettingsProvider>
    <Router>
      <StepsProvider>
        <WebSocketStepsProvider>
          <Routes>
            {/* Redirect root to the first module dashboard */}
            <Route path="/" element={<Navigate to={modules.length > 0 ? `/${modules[0].slug}` : "/"} replace />} />
            
            {/* Dynamic module dashboard routes */}
            {modules.map((module) => (
              <Route 
                key={module.id}
                path={`/${module.slug}`} 
                element={<DynamicModuleRoute moduleSlug={module.slug} />} 
              />
            ))}
            
            {/* Dynamic module workflow routes with document ID */}
            {modules.map((module) => (
              <Route 
                key={`${module.id}-workflow`}
                path={`${module.baseUrl}/:documentId/:stepSlug`} 
                element={<ModuleWorkflow />} 
              />
            ))}
            
            {/* Catch-all redirect to first module dashboard */}
            <Route path="*" element={<Navigate to={modules.length > 0 ? `/${modules[0].slug}` : "/poa"} replace />} />
          </Routes>
        </WebSocketStepsProvider>
      </StepsProvider>
    </Router>
  </SettingsProvider>
);

export default App;