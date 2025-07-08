import React from 'react';
import { Link } from 'react-router-dom';
import { AiOutlineRobot } from 'react-icons/ai';
import { useSteps } from '../context/StepsContext';
import { getModuleThemeColors } from './theme';
import { useLocation } from 'react-router-dom';

const StepsBar: React.FC = () => {
  const { steps, activeStep, documentId, isInitialized, navigateToStepByIndex } = useSteps();
  const location = useLocation();
  
  // Get module slug from location
  const moduleSlug = location.pathname.split('/')[1];

  // Helper to get step URL using the context
  const getStepUrl = (stepIndex: number): string => {
    if (!documentId) return '/';
    // Use the context's navigation which handles module-specific URLs
    return '#'; // Will be handled by onClick
  };

  // Handle step click
  const handleStepClick = (stepIndex: number) => {
    navigateToStepByIndex(stepIndex);
  };

  // Don't render anything if steps are not initialized yet
  if (!isInitialized || steps.length === 0) {
    return (
      <nav className="flex items-center justify-center px-4 py-4 bg-gray-100 border-b border-gray-200">
        <div className="text-sm text-gray-500">
          {!isInitialized ? 'Initializing...' : 'No steps available'}
        </div>
      </nav>
    );
  }

  // Get theme colors from the module
  const themeColors = getModuleThemeColors(moduleSlug);

  return (
    <nav className="flex items-center justify-center px-2 sm:px-6 py-4 bg-gray-100 border-b border-gray-200 overflow-x-auto">
      <div className="flex items-center min-w-max gap-1 sm:gap-2">
        {steps.map((step, index) => {
          return (
            <React.Fragment key={step.title}>
              {/* Step Node */}
              <button
                onClick={() => handleStepClick(index)}
                className="flex flex-col items-center focus:outline-none flex-shrink-0 group"
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors text-base sm:text-lg
                    ${index === activeStep ? `${themeColors?.bg || 'bg-blue-600'} text-white` : 'bg-white border border-gray-300 text-gray-600'}`}
                >
                  <AiOutlineRobot />
                </div>
                <span 
                  className="mt-1 text-[10px] sm:text-xs text-center text-gray-700 leading-tight max-w-[50px] sm:max-w-[80px] truncate px-1"
                  title={step.title}
                >
                  {step.title}
                </span>
              </button>

              {/* Connector Line - More visible on mobile */}
              {index < steps.length - 1 && (
                <div className="flex items-center">
                  <div className="w-3 sm:w-6 h-1 sm:h-0.5 bg-gray-400 rounded-full" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

export default StepsBar; 