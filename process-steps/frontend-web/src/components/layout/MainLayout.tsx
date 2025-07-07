import React from 'react';
import EntityPane from '../EntityPane';
import { useLayoutState } from '../../hooks/useLayoutState';
import { getEntityFlexClass, PANE_CLASSES } from '../../utils/layoutUtils';
import { 
  AppHeader, 
  DesktopChatPane, 
  DesktopFindingsPane, 
  MobileComponents 
} from './';

const MainLayout: React.FC = () => {
  const [state, actions] = useLayoutState();

  const {
    mobileChatOpen,
    mobileFindingsOpen,
    findingsPaneCollapsed,
    chatPaneCollapsed,
    findings,
  } = state;

  const {
    setMobileChatOpen,
    setMobileFindingsOpen,
    setFindingsPaneCollapsed,
    setChatPaneCollapsed,
    setFindings,
    closeMobileOverlays,
  } = actions;

  const entityFlexClass = getEntityFlexClass(chatPaneCollapsed, findingsPaneCollapsed);

  return (
    <div className="flex flex-col h-screen">
      {/* Header Section */}
      <AppHeader />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Chat Pane */}
        <DesktopChatPane
          isCollapsed={chatPaneCollapsed}
          onToggleCollapse={setChatPaneCollapsed}
        />

        {/* Entity State Pane */}
        <div
          className={`${PANE_CLASSES.entityTransition} ${entityFlexClass}`}
          onClick={closeMobileOverlays}
        >
          <EntityPane />
        </div>

        {/* Desktop Findings Pane */}
        <DesktopFindingsPane
          isCollapsed={findingsPaneCollapsed}
          findings={findings}
          onToggleCollapse={setFindingsPaneCollapsed}
          onFindingsChange={setFindings}
        />
      </div>

      {/* Mobile Components */}
      <MobileComponents
        mobileChatOpen={mobileChatOpen}
        mobileFindingsOpen={mobileFindingsOpen}
        findings={findings}
        onMobileChatOpenChange={setMobileChatOpen}
        onMobileFindingsOpenChange={setMobileFindingsOpen}
        onFindingsChange={setFindings}
      />
    </div>
  );
};

export default MainLayout; 