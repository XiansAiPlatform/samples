import React, { useState, useEffect, useCallback } from 'react';
import { FiInfo, FiAlertTriangle, FiXCircle, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useFindingsData } from '../hooks/useFindingsData';
import { getAgentById, getStepIndexByBotId } from '../../../modules/poa/utils/stepUtils';
import { useWebSocketSteps } from '../../../context/WebSocketStepsContext';
import { useSteps } from '../../../context/StepsContext';

export type FindingType = 'suggestion' | 'warning' | 'error';

// Finding type colors (semantic colors that match Tailwind colors)
const FINDING_TYPE_COLORS = {
  suggestion: {
    bg: 'bg-info-500',
    bgLight: 'bg-info-100',
    bgDark: 'bg-info-700',
    text: 'text-info-700',
    border: 'border-info-300',
  },
  warning: {
    bg: 'bg-warning-500',
    bgLight: 'bg-warning-100',
    bgDark: 'bg-warning-700',
    text: 'text-warning-700',
    border: 'border-warning-300',
  },
  error: {
    bg: 'bg-error-500',
    bgLight: 'bg-error-100',
    bgDark: 'bg-error-700',
    text: 'text-error-700',
    border: 'border-error-300',
  },
} as const;

export interface Finding {
  id: number;
  type: FindingType;
  title: string;
  description: string;
  link?: string;
  actions?: Array<{
    title: string;
    prompt: string;
    scope?: string;
  }>;
}



const severityRank: Record<FindingType, number> = { error: 0, warning: 1, suggestion: 2 };

const typeStyles: Record<FindingType, { 
  icon: React.ReactNode; 
  pillBg: string; 
  textColor: string; 
  borderColor: string; 
  cardBg: string 
}> = {
  suggestion: { 
    icon: <FiInfo />, 
    pillBg: FINDING_TYPE_COLORS.suggestion.bgLight, 
    textColor: FINDING_TYPE_COLORS.suggestion.text, 
    borderColor: FINDING_TYPE_COLORS.suggestion.border, 
    cardBg: FINDING_TYPE_COLORS.suggestion.bgLight 
  },
  warning: { 
    icon: <FiAlertTriangle />, 
    pillBg: FINDING_TYPE_COLORS.warning.bgLight, 
    textColor: FINDING_TYPE_COLORS.warning.text, 
    borderColor: FINDING_TYPE_COLORS.warning.border, 
    cardBg: FINDING_TYPE_COLORS.warning.bgLight 
  },
  error: { 
    icon: <FiXCircle />, 
    pillBg: FINDING_TYPE_COLORS.error.bgLight, 
    textColor: FINDING_TYPE_COLORS.error.text, 
    borderColor: FINDING_TYPE_COLORS.error.border, 
    cardBg: FINDING_TYPE_COLORS.error.bgLight 
  },
};

interface FindingsPaneProps {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  onFindingsChange?: (findings: Finding[]) => void;
  hideCollapseButton?: boolean;
}

const FindingsPane: React.FC<FindingsPaneProps> = ({ isCollapsed, onToggleCollapse, onFindingsChange, hideCollapseButton }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // Use contexts for step navigation and WebSocket messaging
  const { activeStep, setActiveStep } = useSteps();
  const { sendMessage, setHandoffTyping } = useWebSocketSteps();
  
  // Use findings-specific hook that subscribes directly to audit result entities
  const {
    findings,
    loading: documentLoading,
    error: documentError,
    auditResult
  } = useFindingsData();

  // Notify parent of findings changes - MUST be before any conditional returns
  useEffect(() => {
    onFindingsChange?.(findings);
  }, [findings, onFindingsChange]);

  // Handle action button clicks similar to handoff detection and navigation
  const handleAction = useCallback(async (prompt: string | undefined, scope?: string) => {
    if (!prompt) {
      console.warn('[FindingsPane] No prompt provided for action');
      return;
    }
    
    console.log(`[FindingsPane] 🚀 Processing action:`, { prompt, scope });
    
    // Helper function to send message with proper error handling
    const sendMessageSafely = async (targetStep: number, message: string) => {
      try {
        console.log(`[FindingsPane] 📨 Sending message to step ${targetStep}: "${message}"`);
        await sendMessage(message, undefined, targetStep); // Pass targetStep as third parameter
        console.log(`[FindingsPane] ✅ Message sent successfully to step ${targetStep}`);
      } catch (error) {
        console.error(`[FindingsPane] ❌ Error sending message to step ${targetStep}:`, error);
        // Hide typing indicator on error
        setHandoffTyping(targetStep, false);
        throw error; // Re-throw to handle at higher level if needed
      }
    };

    // Helper function to wait for step to become active
    const waitForStepActivation = (targetStep: number, maxAttempts = 10): Promise<boolean> => {
      return new Promise((resolve) => {
        let attempts = 0;
        const checkActive = () => {
          attempts++;
          if (activeStep === targetStep) {
            console.log(`[FindingsPane] ✅ Step ${targetStep} is now active after ${attempts} attempts`);
            resolve(true);
          } else if (attempts >= maxAttempts) {
            console.warn(`[FindingsPane] ⚠️ Step ${targetStep} not active after ${maxAttempts} attempts, proceeding anyway`);
            resolve(false);
          } else {
            console.log(`[FindingsPane] ⏳ Waiting for step ${targetStep} to become active... (attempt ${attempts})`);
            setTimeout(checkActive, 100); // Check every 100ms
          }
        };
        checkActive();
      });
    };
    
    // If scope is provided, find the target step and navigate
    if (scope) {
      const targetStepIndex = getStepIndexByBotId(scope);
      
      if (targetStepIndex !== null) {
        console.log(`[FindingsPane] 🧭 Navigation decision:`);
        console.log(`[FindingsPane] - targetStepIndex: ${targetStepIndex}`);
        console.log(`[FindingsPane] - activeStep: ${activeStep}`);
        console.log(`[FindingsPane] - Will navigate: ${targetStepIndex !== activeStep}`);
        
        // Navigate to target step if different from current
        if (targetStepIndex !== activeStep) {
          console.log(`[FindingsPane] ✅ Navigating to step ${targetStepIndex} for action`);
          
          // Navigate to the target step first
          setActiveStep(targetStepIndex);
          
          // Wait for step to become active, then set typing indicator and send message
          try {
            const stepActivated = await waitForStepActivation(targetStepIndex);
            
            // Set typing indicator after navigation is complete
            console.log(`[FindingsPane] 💬 Setting typing indicator for step ${targetStepIndex}`);
            setHandoffTyping(targetStepIndex, true);
            
            // Send the message with additional delay if step wasn't properly activated
            const additionalDelay = stepActivated ? 100 : 500;
            setTimeout(async () => {
              await sendMessageSafely(targetStepIndex, prompt);
            }, additionalDelay);
            
          } catch (error) {
            console.error(`[FindingsPane] ❌ Error during navigation and message sending:`, error);
            setHandoffTyping(targetStepIndex, false);
          }
          
        } else {
          console.log(`[FindingsPane] 🔄 Already on target step ${targetStepIndex}, sending message directly`);
          
          // Set typing indicator and send message directly if already on target step
          setHandoffTyping(targetStepIndex, true);
          console.log(`[FindingsPane] 💬 Setting typing indicator for current step ${targetStepIndex}`);
          
          await sendMessageSafely(targetStepIndex, prompt);
        }
      } else {
        console.warn(`[FindingsPane] ⚠️ Could not find step for scope: ${scope}`);
        
        // Fallback: send message to current step if no target found
        if (activeStep !== null) {
          console.log(`[FindingsPane] 🔄 Fallback: sending to current step ${activeStep}`);
          setHandoffTyping(activeStep, true);
          console.log(`[FindingsPane] 💬 Setting typing indicator for current step ${activeStep} (fallback)`);
          
          await sendMessageSafely(activeStep, prompt);
        } else {
          console.error(`[FindingsPane] ❌ No active step available for fallback`);
        }
      }
    } else {
      console.log(`[FindingsPane] 📨 No scope provided, sending message to current step`);
      
      // No scope provided, send to current step
      if (activeStep !== null) {
        setHandoffTyping(activeStep, true);
        console.log(`[FindingsPane] 💬 Setting typing indicator for current step ${activeStep}`);
        
        await sendMessageSafely(activeStep, prompt);
      } else {
        console.error(`[FindingsPane] ❌ No active step available`);
      }
    }
  }, [activeStep, setActiveStep, sendMessage, setHandoffTyping]);

  // Helper functions for loading messages
  const getLoadingMessage = () => {
    return 'Loading document analysis...';
  };

  const getLoadingDetail = () => {
    return 'Analyzing document for findings...';
  };

  // Show enhanced loading state
  if (documentLoading) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        <header className="px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">Findings</h2>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-base font-medium text-gray-900 mb-2">{getLoadingMessage()}</h3>
            <p className="text-gray-600 text-sm">{getLoadingDetail()}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show enhanced error state
  if (documentError) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        <header className="px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">Findings</h2>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm mx-auto">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Error Loading Analysis</h3>
            <p className="text-gray-600 text-sm mb-4">{documentError}</p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Retry Loading Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show no document message
  if (!auditResult && !documentLoading && !documentError) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-gray-200">
        <header className="px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">Findings</h2>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 text-sm">No document selected</div>
        </div>
      </div>
    );
  }

  // Calculate counts by type
  const findingCounts = findings.reduce((acc, finding) => {
    acc[finding.type] = (acc[finding.type] || 0) + 1;
    return acc;
  }, {} as Record<FindingType, number>);

  // Expanded view
  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-gray-800">Findings</h2>
            <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
              {findings.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {!hideCollapseButton && (
              <button
                onClick={() => onToggleCollapse?.(true)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Collapse findings pane"
              >
                <FiChevronRight className="text-lg" />
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto space-y-3 p-3">
        {findings.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm text-center">
              <FiInfo className="mx-auto text-2xl mb-2" />
              <p>No findings available</p>
              <p className="text-xs mt-1">Document validation results will appear here</p>
            </div>
          </div>
        ) : (
          [...findings].sort((a,b) => severityRank[a.type] - severityRank[b.type]).map((finding) => {
            const isExpanded = expandedId === finding.id;
            const { icon, pillBg, textColor, borderColor, cardBg } = typeStyles[finding.type];
            return (
              <div key={finding.id}>
                {/* Collapsed pill */}
                {!isExpanded && (
                  <button
                    onClick={() => setExpandedId(finding.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm shadow-sm transition-transform hover:scale-105 focus:outline-none ${pillBg} ${textColor}`}
                  >
                    {icon}
                    <span className="truncate max-w-xs">{finding.title}</span>
                  </button>
                )}

                {/* Expanded card */}
                {isExpanded && (
                  <div 
                    className={`rounded-lg shadow-sm border-l-4 p-4 space-y-3 cursor-pointer ${borderColor} ${cardBg}`}
                    onClick={() => setExpandedId(null)}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-xl ${textColor}`}>{icon}</span>
                      <h3 className={`font-semibold text-sm flex-1 ${textColor}`}>{finding.title}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(null);
                        }}
                        aria-label="Collapse"
                        className="text-gray-500 hover:text-gray-700 text-lg"
                      >
                        <FiChevronDown className="transform rotate-180" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-700">{finding.description}</p>
                    <div className="flex flex-col gap-3">
                      {/* Action buttons */}
                      {finding.actions && finding.actions.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                          {finding.actions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(action.prompt, action.scope);
                              }}
                              className="inline-flex items-center px-4 py-2 bg-primary-light text-white rounded-md text-sm font-medium hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 transition-colors"
                            >
                              {action.title}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Learn more link */}
                      {finding.link && (
                        <a
                          href={finding.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-light underline hover:text-primary self-start"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Learn more
                        </a>
                      )}                    
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FindingsPane; 