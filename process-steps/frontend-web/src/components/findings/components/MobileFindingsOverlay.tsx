import React from 'react';
import { Finding } from './FindingsPane';
import FindingsPane from './FindingsPane';

interface MobileFindingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  findings: Finding[];
  onFindingsChange: (findings: Finding[]) => void;
}

const MobileFindingsOverlay: React.FC<MobileFindingsOverlayProps> = ({ 
  isOpen, 
  onClose, 
  findings, 
  onFindingsChange 
}) => {
  return (
    <div
      className={`sm:hidden fixed inset-y-0 right-0 w-4/5 max-w-xs bg-white shadow-lg z-30 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="absolute top-0 left-0 right-0 flex justify-between p-2 border-b border-neutral-200 bg-white z-10">
        <h2 className="text-sm font-medium text-primary"></h2>
        <button
          aria-label="Close findings"
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-700"
        >
          ✕
        </button>
      </div>
      <div className="absolute top-12 bottom-0 left-0 right-0">
        <FindingsPane
          isCollapsed={false}
          onToggleCollapse={() => {}}
          onFindingsChange={onFindingsChange}
          hideCollapseButton={true}
        />
      </div>
    </div>
  );
};

export default MobileFindingsOverlay; 