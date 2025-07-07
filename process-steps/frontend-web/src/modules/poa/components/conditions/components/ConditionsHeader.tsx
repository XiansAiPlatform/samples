import React from 'react';
import { Condition } from '../../../services/DocumentService';
import { getThemeColors } from '../../../../../components/theme';

interface ConditionsHeaderProps {
  conditions: Condition[];
  onSave: () => void;
}

const countConditionsWithText = (conditions: Condition[]): number => {
  return conditions.filter(condition => condition.text.trim().length > 0).length;
};

const getValidConditions = (conditions: Condition[]): Condition[] => {
  return conditions.filter(condition => condition.text.trim().length > 0);
};

const ConditionsHeader: React.FC<ConditionsHeaderProps> = ({
  conditions,
  onSave
}) => {
  const conditionCount = countConditionsWithText(conditions);
  const hasValidData = getValidConditions(conditions).length > 0;
  
  const successTheme = getThemeColors('purple');   // Using purple for success/save actions

  return (
    <header className="border-b border-gray-200 flex-shrink-0">
      <div className="px-7 sm:px-10 lg:px-14 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Define terms and conditions</p>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-600">
                {conditionCount} condition{conditionCount !== 1 ? 's' : ''}
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ConditionsHeader; 