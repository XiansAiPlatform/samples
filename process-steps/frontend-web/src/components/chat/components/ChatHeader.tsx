import React from 'react';
import { AiOutlineRobot } from 'react-icons/ai';
import { FiChevronLeft } from 'react-icons/fi';
import { getThemeColors, ThemeName } from '../../theme';

interface ChatHeaderProps {
  bot: {
    title: string;
    description?: string;
  };
  theme: string;
  connectionState?: {
    status: string;
  };
  isStepConnected: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  bot, 
  theme, 
  connectionState, 
  isStepConnected,
  isCollapsed,
  onToggleCollapse
}) => {
  const themeColors = getThemeColors(theme as ThemeName);

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-3 w-full max-w-sm ml-auto">
        {/* Collapse button - hidden on mobile */}
        <button
          onClick={() => onToggleCollapse?.(true)}
          className="hidden sm:block text-gray-600 hover:text-gray-800 transition-colors"
          aria-label="Collapse chat pane"
        >
          <FiChevronLeft className="text-lg" />
        </button>
        
        {/* Bot info section */}
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${themeColors.bg}`}>
            <AiOutlineRobot />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-semibold text-gray-900 tracking-tight text-balance">{bot.title}</h3>
            {bot.description && (
              <p className="text-xs text-gray-500 font-normal">{bot.description}</p>
            )}
          </div>
          {connectionState && (
            <div className={`w-2 h-2 rounded-full ${
              isStepConnected ? 'bg-green-500' : 
              connectionState.status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`} title={connectionState.status} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader; 