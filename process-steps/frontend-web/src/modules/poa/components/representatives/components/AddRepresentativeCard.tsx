import React from 'react';
import { getThemeColors } from '../../../../../components/theme';

interface AddRepresentativeCardProps {
  onAdd: () => void;
}

const AddRepresentativeCard: React.FC<AddRepresentativeCardProps> = ({ onAdd }) => {
  const theme = getThemeColors('purple');
  
  return (
    <div 
      className={`border-2 border-dashed ${theme.border} rounded-lg p-3 sm:p-4 ${theme.bgLight} hover:${theme.buttonSecondaryHover} hover:${theme.border.replace('-200', '-400')} transition-all cursor-pointer flex items-center justify-center min-h-[160px] sm:min-h-[200px] touch-manipulation`}
      onClick={onAdd}
    >
      <div className="text-center">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 ${theme.buttonSecondary} rounded-full flex items-center justify-center border ${theme.buttonSecondaryBorder}`}>
          <span className={`${theme.bg.replace('bg-', 'text-')} text-lg sm:text-xl font-bold`}>+</span>
        </div>
        <div className={`text-sm font-medium ${theme.text} mb-1`}>Add Representative</div>
        <div className="text-xs text-gray-500 px-2">Click to add a new representative</div>
      </div>
    </div>
  );
};

export default AddRepresentativeCard; 