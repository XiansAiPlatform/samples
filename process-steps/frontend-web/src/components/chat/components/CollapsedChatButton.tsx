import React from 'react';
import { FiChevronRight, FiMessageSquare } from 'react-icons/fi';

interface CollapsedChatButtonProps {
  onExpand: () => void;
}

const CollapsedChatButton: React.FC<CollapsedChatButtonProps> = ({ onExpand }) => {
  return (
    <div className="hidden sm:block">
      <div 
        className="h-full w-16 bg-white border-r border-gray-200 flex flex-col shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onExpand}
        aria-label="Expand chat pane"
      >
        {/* Header with expand button */}
        <div className="px-2 py-2 border-b border-gray-200">
          <div className="w-full flex justify-center text-gray-600">
            <FiChevronRight className="text-lg" />
          </div>
        </div>
        
        {/* Chat indicator */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">
            <FiMessageSquare className="text-sm text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700">AI Agent</span>
        </div>
      </div>
    </div>
  );
};

export default CollapsedChatButton; 