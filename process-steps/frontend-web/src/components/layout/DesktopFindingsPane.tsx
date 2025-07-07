import React from 'react';
import { FindingsPane, CollapsedFindingsButton, Finding } from '../findings';
import { PANE_CLASSES } from '../../utils/layoutUtils';

interface DesktopFindingsPaneProps {
  isCollapsed: boolean;
  findings: Finding[];
  onToggleCollapse: (collapsed: boolean) => void;
  onFindingsChange: (findings: Finding[]) => void;
}

const DesktopFindingsPane: React.FC<DesktopFindingsPaneProps> = ({
  isCollapsed,
  findings,
  onToggleCollapse,
  onFindingsChange,
}) => {
  if (isCollapsed) {
    return (
      <CollapsedFindingsButton
        findings={findings}
        onExpand={() => onToggleCollapse(false)}
      />
    );
  }

  return (
    <div className={`${PANE_CLASSES.base} ${PANE_CLASSES.findingsBorder}`}>
      <FindingsPane 
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        onFindingsChange={onFindingsChange}
      />
    </div>
  );
};

export default DesktopFindingsPane; 