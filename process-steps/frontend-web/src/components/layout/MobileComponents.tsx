import React from 'react';
import {
  MobileChatOverlay,
  MobileChatButton,
} from '../chat';
import {
  MobileFindingsOverlay,
  MobileFindingsButton,
  Finding,
} from '../findings';

interface MobileComponentsProps {
  mobileChatOpen: boolean;
  mobileFindingsOpen: boolean;
  findings: Finding[];
  onMobileChatOpenChange: (open: boolean) => void;
  onMobileFindingsOpenChange: (open: boolean) => void;
  onFindingsChange: (findings: Finding[]) => void;
}

const MobileComponents: React.FC<MobileComponentsProps> = ({
  mobileChatOpen,
  mobileFindingsOpen,
  findings,
  onMobileChatOpenChange,
  onMobileFindingsOpenChange,
  onFindingsChange,
}) => (
  <>
    {/* Mobile Overlays */}
    <MobileChatOverlay
      isOpen={mobileChatOpen}
      onClose={() => onMobileChatOpenChange(false)}
    />
    
    <MobileFindingsOverlay
      isOpen={mobileFindingsOpen}
      onClose={() => onMobileFindingsOpenChange(false)}
      findings={findings}
      onFindingsChange={onFindingsChange}
    />

    {/* Mobile Action Buttons */}
    <MobileChatButton
      isOpen={mobileChatOpen}
      onOpen={() => onMobileChatOpenChange(true)}
    />
    
    <MobileFindingsButton
      isOpen={mobileFindingsOpen}
      onOpen={() => onMobileFindingsOpenChange(true)}
    />
  </>
);

export default MobileComponents; 