import React from 'react';
import { FiChevronLeft, FiInfo } from 'react-icons/fi';
import { Finding, FindingType } from './FindingsPane';
import { FINDING_TYPE_INFO } from '../types';
import { calculateFindingCounts } from '../utils';

interface CollapsedFindingsButtonProps {
  findings: Finding[];
  onExpand: () => void;
}

const CollapsedFindingsButton: React.FC<CollapsedFindingsButtonProps> = ({ findings, onExpand }) => {
  const findingCounts = calculateFindingCounts(findings);

  return (
    <div className="hidden sm:block">
      <div 
        className="h-full w-16 bg-white border-l border-gray-200 flex flex-col shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onExpand}
        aria-label="Expand findings pane"
      >
        {/* Header with expand button */}
        <div className="px-2 py-2 border-b border-gray-200">
          <div className="w-full flex justify-center text-gray-600">
            <FiChevronLeft className="text-lg" />
          </div>
        </div>
        
        {/* Finding counts */}
        <div className="flex-1 flex flex-col justify-start pt-4 space-y-4">
          {(['error', 'warning', 'suggestion'] as FindingType[]).map((type) => {
            const count = findingCounts[type] || 0;
            if (count === 0) return null;
            
            const { icon, color, bgColor } = FINDING_TYPE_INFO[type];
            return (
              <div
                key={type}
                className="flex flex-col items-center gap-1 px-2"
                title={`${count} ${type}${count !== 1 ? 's' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
                  <span className={`text-sm ${color}`}>{icon}</span>
                </div>
                <span className="text-xs font-semibold text-gray-700">{count}</span>
              </div>
            );
          })}
          
          {/* Show total if no specific types or as summary */}
          {findings.length > 0 && Object.values(findingCounts).every(count => count === 0) && (
            <div className="flex flex-col items-center gap-1 px-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-sm text-gray-600"><FiInfo /></span>
              </div>
              <span className="text-xs font-semibold text-gray-700">{findings.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollapsedFindingsButton; 