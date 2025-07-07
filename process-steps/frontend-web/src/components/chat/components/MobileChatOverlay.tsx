import React from 'react';
import ChatPane from '../ChatPane';

interface MobileChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileChatOverlay: React.FC<MobileChatOverlayProps> = ({ isOpen, onClose }) => {
  return (
    <div
      className={`sm:hidden fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-lg z-30 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="absolute top-0 left-0 right-0 flex justify-end p-2 border-b border-neutral-200 bg-white z-10">
        <button
          aria-label="Close chat"
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-700"
        >
          ✕
        </button>
      </div>
      <div className="absolute top-12 bottom-0 left-0 right-0">
        <ChatPane 
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      </div>
    </div>
  );
};

export default MobileChatOverlay; 