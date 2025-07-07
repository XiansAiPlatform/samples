import React from 'react';
import { getThemeColors, ThemeName } from '../../theme';

interface SuggestionButtonsProps {
  theme: string;
  isTyping: boolean;
  isCollapsed?: boolean;
  suggestions?: string[];
  onSuggestionClick: (suggestion: string) => void;
  onToggleCollapse?: () => void;
}

const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({
  theme,
  isTyping,
  isCollapsed = false,
  suggestions = ['Can you assist me?', 'What should I do next?'],
  onSuggestionClick,
  onToggleCollapse,
}) => {
  const themeColors = getThemeColors(theme as ThemeName);

  return (
    <div className={`px-4 border-t border-gray-100 bg-white transition-all duration-200 ${
      isCollapsed ? 'py-2' : 'py-3'
    }`}>
      <div className="w-full">
        <div 
          className={`flex items-center justify-end gap-2 ${
            isCollapsed && onToggleCollapse 
              ? 'cursor-pointer hover:opacity-70 transition-opacity duration-200' 
              : ''
          }`}
          onClick={isCollapsed && onToggleCollapse ? onToggleCollapse : undefined}
        >
          <p className="text-xs text-gray-500 font-medium">What can I help you with?</p>
          {onToggleCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent double triggering when clicking the button directly
                onToggleCollapse();
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label={isCollapsed ? 'Expand suggestions' : 'Collapse suggestions'}
            >
              {isCollapsed ? '▲' : '▼'}
            </button>
          )}
        </div>
        
        <div className={`transition-all duration-200 overflow-hidden ${
          isCollapsed ? 'max-h-0 py-0' : 'max-h-20 py-2'
        }`}>
          <div className="flex flex-wrap gap-2 justify-end">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                disabled={isTyping}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 font-medium ${themeColors.bgLight} ${themeColors.text} ${themeColors.border} disabled:opacity-50`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionButtons; 