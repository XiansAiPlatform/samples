import React from 'react';

interface MobileChatButtonProps {
  isOpen: boolean;
  onOpen: () => void;
}

const MobileChatButton: React.FC<MobileChatButtonProps> = ({ isOpen, onOpen }) => {
  if (isOpen) return null;

  return (
    <button
      aria-label="Open chat"
      onClick={onOpen}
      className="sm:hidden fixed left-0 top-1/2 -translate-y-1/2 w-6 h-24 bg-primary text-white flex items-center justify-center rounded-r shadow-lg"
    >
      <span className="transform -rotate-90 text-xs tracking-widest select-none whitespace-nowrap">AI Agent</span>
    </button>
  );
};

export default MobileChatButton; 