import React from 'react';
import { Condition } from '../../../services/DocumentService';
import { getThemeColors } from '../../../../../components/theme';

interface AddConditionCardProps {
  onAdd: (condition: Omit<Condition, 'id'>) => void;
}

const AddConditionCard: React.FC<AddConditionCardProps> = ({ onAdd }) => {
  const theme = getThemeColors('purple');

  const handleAddCondition = () => {
    onAdd({
      text: '',
      type: 2, // Default to 'General'
      targetId: null
    });
  };

  return (
    <button
      onClick={handleAddCondition}
      className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg p-6 mb-3 text-gray-500 hover:text-purple-600 transition-colors group"
    >
      <div className="flex items-center justify-center gap-3">
        <div className={`w-8 h-8 rounded-full ${theme.bgLight} ${theme.border} border-2 border-dashed flex items-center justify-center group-hover:border-purple-400 transition-colors`}>
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
            />
          </svg>
        </div>
        
        <div className="text-left">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
            Add New Condition
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Define a new term or condition for this document
          </p>
        </div>
      </div>
    </button>
  );
};

export default AddConditionCard; 