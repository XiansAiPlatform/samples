import React from 'react';

interface MobileFindingsButtonProps {
  isOpen: boolean;
  onOpen: () => void;
}

const MobileFindingsButton: React.FC<MobileFindingsButtonProps> = ({ isOpen, onOpen }) => {
  if (isOpen) return null;

  return (
    <button
      aria-label="Open findings"
      onClick={onOpen}
      className="sm:hidden fixed right-0 top-1/2 -translate-y-1/2 w-6 h-24 bg-accent text-white flex items-center justify-center rounded-l shadow-lg"
    >
      <span className="transform rotate-90 text-xs tracking-widest select-none">FINDINGS</span>
    </button>
  );
};

export default MobileFindingsButton; 