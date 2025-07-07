import React from 'react';
import { getThemeColors } from '../../../components/theme';

interface DocumentScopeHeaderProps {
  onStartWithAI: () => void;
}

const DocumentScopeHeader: React.FC<DocumentScopeHeaderProps> = ({
  onStartWithAI
}) => {
  const theme = getThemeColors('purple');

  return (
    <header className="border-b border-gray-200 flex-shrink-0">
      <div className="px-7 sm:px-10 lg:px-14 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Document scope and principal information</p>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={onStartWithAI}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md transition-colors flex items-center gap-1 sm:gap-2 ${theme.buttonPrimary} text-white ${theme.buttonPrimaryHover}`}
              >
                <svg 
                  width="12" 
                  height="12" 
                  className="sm:w-[14px] sm:h-[14px]"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5"></circle>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                </svg>
                <span>Start with AI</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DocumentScopeHeader; 