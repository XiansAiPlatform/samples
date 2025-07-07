import React from 'react';
import { ChatPane, CollapsedChatButton } from '../chat';
import { PANE_CLASSES } from '../../utils/layoutUtils';

interface DesktopChatPaneProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

const DesktopChatPane: React.FC<DesktopChatPaneProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  if (isCollapsed) {
    return (
      <CollapsedChatButton
        onExpand={() => onToggleCollapse(false)}
      />
    );
  }

  return (
    <div className={`${PANE_CLASSES.base} ${PANE_CLASSES.chatBorder}`}>
      <ChatPane 
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </div>
  );
};

export default DesktopChatPane; 