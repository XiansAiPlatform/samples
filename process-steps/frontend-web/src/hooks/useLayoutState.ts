import { useState } from 'react';
import { Finding } from '../components/findings';

export interface LayoutState {
  mobileChatOpen: boolean;
  mobileFindingsOpen: boolean;
  findingsPaneCollapsed: boolean;
  chatPaneCollapsed: boolean;
  findings: Finding[];
}

export interface LayoutActions {
  setMobileChatOpen: (open: boolean) => void;
  setMobileFindingsOpen: (open: boolean) => void;
  setFindingsPaneCollapsed: (collapsed: boolean) => void;
  setChatPaneCollapsed: (collapsed: boolean) => void;
  setFindings: (findings: Finding[]) => void;
  closeMobileOverlays: () => void;
  toggleChatPane: () => void;
  toggleFindingsPane: () => void;
}

export const useLayoutState = (): [LayoutState, LayoutActions] => {
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [mobileFindingsOpen, setMobileFindingsOpen] = useState(false);
  const [findingsPaneCollapsed, setFindingsPaneCollapsed] = useState(false);
  const [chatPaneCollapsed, setChatPaneCollapsed] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);

  const closeMobileOverlays = () => {
    setMobileChatOpen(false);
    setMobileFindingsOpen(false);
  };

  const toggleChatPane = () => setChatPaneCollapsed(!chatPaneCollapsed);
  const toggleFindingsPane = () => setFindingsPaneCollapsed(!findingsPaneCollapsed);

  const state: LayoutState = {
    mobileChatOpen,
    mobileFindingsOpen,
    findingsPaneCollapsed,
    chatPaneCollapsed,
    findings,
  };

  const actions: LayoutActions = {
    setMobileChatOpen,
    setMobileFindingsOpen,
    setFindingsPaneCollapsed,
    setChatPaneCollapsed,
    setFindings,
    closeMobileOverlays,
    toggleChatPane,
    toggleFindingsPane,
  };

  return [state, actions];
}; 