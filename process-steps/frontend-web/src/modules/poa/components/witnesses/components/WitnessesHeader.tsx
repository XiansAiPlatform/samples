import React from 'react';
import { Witness } from '../types/witness.types';
import { getThemeColors } from '../../../../../components/theme';

interface WitnessesHeaderProps {
  witnesses: Witness[];
  onSave: () => void;
}

const countWitnessesWithNames = (witnesses: Witness[]): number => {
  return witnesses.filter(witness => witness.name.trim().length > 0).length;
};

const getValidWitnesses = (witnesses: Witness[]): Witness[] => {
  return witnesses.filter(witness => witness.name.trim().length > 0);
};

const WitnessesHeader: React.FC<WitnessesHeaderProps> = ({
  witnesses,
  onSave
}) => {
  const witnessCount = countWitnessesWithNames(witnesses);
  const hasValidData = getValidWitnesses(witnesses).length > 0;
  
  const successTheme = getThemeColors('purple');   // Using purple for success/save actions

  return (
    <header className="border-b border-gray-200 flex-shrink-0">
      <div className="px-7 sm:px-10 lg:px-14 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Manage the witnesses</p>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-600">
                {witnessCount} witness{witnessCount !== 1 ? 'es' : ''}
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default WitnessesHeader; 