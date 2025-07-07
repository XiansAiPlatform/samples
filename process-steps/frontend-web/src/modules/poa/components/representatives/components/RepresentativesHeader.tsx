import React from 'react';
import { Representative } from '../types/representative.types';
import { countRepresentativesWithNames, getValidRepresentatives } from '../utils/representative.utils';
import { getThemeColors } from '../../../../../components/theme';

interface RepresentativesHeaderProps {
  representatives: Representative[];
  onSave: () => void;
}

const RepresentativesHeader: React.FC<RepresentativesHeaderProps> = ({
  representatives,
  onSave
}) => {
  const representativeCount = countRepresentativesWithNames(representatives);
  const hasValidData = getValidRepresentatives(representatives).length > 0;
  
  const successTheme = getThemeColors('purple');   // Using blue for success/save actions

  return (
    <header className="border-b border-gray-200 flex-shrink-0">
      <div className="px-7 sm:px-10 lg:px-14 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Manage the representatives</p>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-600">
                {representativeCount} rep{representativeCount !== 1 ? 's' : ''}
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default RepresentativesHeader; 