import React from 'react';
import { Witness } from '../types/witness.types';
import { getThemeColors } from '../../../../../components/theme';

interface AddWitnessCardProps {
  onAdd: (witness: Omit<Witness, 'id'>) => void;
}

const AddWitnessCard: React.FC<AddWitnessCardProps> = ({ onAdd }) => {
  const theme = getThemeColors('purple');

  const handleAddWitness = () => {
    onAdd({
      name: '',
      email: '',
      phone: '',
      address: '',
      relationship: ''
    });
  };

  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors">
      <button
        onClick={handleAddWitness}
        className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 text-gray-500 hover:text-purple-600 transition-colors group"
      >
        <div className={`w-12 h-12 rounded-full ${theme.bgLight} ${theme.border} border-2 border-dashed flex items-center justify-center mb-3 group-hover:border-purple-400 transition-colors`}>
          <svg 
            className="w-6 h-6" 
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
        
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors mb-1">
          Add Witness
        </h3>
        
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          Add a witness who will observe the document signing
        </p>
      </button>
    </div>
  );
};

export default AddWitnessCard; 