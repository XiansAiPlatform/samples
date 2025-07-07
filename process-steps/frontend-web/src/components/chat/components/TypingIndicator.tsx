import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useWebSocketSteps } from '../../../context/WebSocketStepsContext';
import { useSteps } from '../../../context/StepsContext';
import { ActivityData } from '../../../types';

interface TypingIndicatorProps {
  typingStage: 'contacting' | 'waiting' | 'long-wait';
  onContentChange?: () => void;
}

// Global variable to track the most recent typing indicator instance
let currentActiveIndicator: string | null = null;

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingStage, onContentChange }) => {
  const instanceId = useRef(`typing-${Date.now()}-${Math.random()}`);
  
  // Get ActivityLog data from WebSocketStepsContext instead of managing local state
  const { activityLogStates } = useWebSocketSteps();
  const { activeStep } = useSteps();
  
  // Get activities for the current step
  const activities = activeStep !== null ? (activityLogStates.get(activeStep) || []) : [];

  // Mark this as the current active indicator when it mounts or stage changes
  useEffect(() => {
    console.log('[TypingIndicator] Marking as active indicator:', instanceId.current, 'stage:', typingStage);
    currentActiveIndicator = instanceId.current;
  }, [typingStage]);

  // Clear activities when component unmounts
  useEffect(() => {
    return () => {
      console.log('[TypingIndicator] Component unmounting for:', instanceId.current);
      if (currentActiveIndicator === instanceId.current) {
        currentActiveIndicator = null;
      }
    };
  }, []);

  // Notify parent when content changes (height might change)
  useEffect(() => {
    if (onContentChange) {
      onContentChange();
    }
  }, [activities, onContentChange]);

  const getTypingText = () => {
    switch (typingStage) {
      case 'contacting':
        return 'contacting agent';
      case 'waiting':
      case 'long-wait':
        return 'waiting for reply';
      default:
        return 'typing';
    }
  };

  // Get stage-specific styling for enhanced prominence
  const getStageStyles = () => {
    switch (typingStage) {
      case 'contacting':
        return {
          container: 'border-purple-300 bg-gradient-to-r from-purple-50 to-lavender-50 shadow-lg shadow-purple-100/50',
          dots: 'bg-gradient-to-r from-purple-500 to-lavender-500',
          text: 'text-purple-700 font-medium',
          dotAnimation: 'animate-pulse',
          ringEffect: 'ring-2 ring-purple-200/30 ring-offset-1'
        };
      case 'waiting':
        return {
          container: 'border-warm-300 bg-gradient-to-r from-warm-50 to-cream-50 shadow-lg shadow-warm-100/50',
          dots: 'bg-gradient-to-r from-warm-500 to-warm-600',
          text: 'text-warm-700 font-medium',
          dotAnimation: 'animate-bounce',
          ringEffect: 'ring-2 ring-warm-200/30 ring-offset-1'
        };
      case 'long-wait':
        return {
          container: 'border-blue-300 bg-gradient-to-r from-blue-50 to-info-50 shadow-lg shadow-blue-100/50',
          dots: 'bg-gradient-to-r from-blue-500 to-info-500',
          text: 'text-blue-700 font-medium',
          dotAnimation: 'animate-pulse',
          ringEffect: 'ring-2 ring-blue-200/30 ring-offset-1'
        };
      default:
        return {
          container: 'border-gray-200 bg-white shadow',
          dots: 'bg-gray-400',
          text: 'text-gray-600',
          dotAnimation: 'animate-bounce',
          ringEffect: ''
        };
    }
  };

  const renderActivityContent = () => {
    if (activities.length > 0) {
      return (
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <div key={activity.id || index} className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse shadow-sm"></div>
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse shadow-sm" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse shadow-sm" style={{ animationDelay: '400ms' }}></div>
                </div>
                <span className="text-blue-600 text-xs font-medium">
                  {activity.success === false ? '⚠️ ' : ''}
                  {activity.summary}
                </span>
              </div>
              {activity.details && (
                <div className="text-xs text-gray-500 ml-4 pl-2 border-l-2 border-gray-200">
                  {activity.details}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    const stageStyles = getStageStyles();

    return (
      <div className="flex items-center space-x-3">
        <div className="flex space-x-1 relative">
          {/* Enhanced dots with stage-specific styling */}
          <div className={`w-2 h-2 ${stageStyles.dots} rounded-full ${stageStyles.dotAnimation} shadow-sm`} 
               style={{ animationDelay: '0ms' }}></div>
          <div className={`w-2 h-2 ${stageStyles.dots} rounded-full ${stageStyles.dotAnimation} shadow-sm`} 
               style={{ animationDelay: '150ms' }}></div>
          <div className={`w-2 h-2 ${stageStyles.dots} rounded-full ${stageStyles.dotAnimation} shadow-sm`} 
               style={{ animationDelay: '300ms' }}></div>
          
          {/* Subtle glow effect for contacting and waiting stages */}
          {(typingStage === 'contacting' || typingStage === 'waiting') && (
            <div className="absolute inset-0 flex space-x-1">
              <div className={`w-2 h-2 ${stageStyles.dots} rounded-full opacity-30 blur-sm ${stageStyles.dotAnimation}`} 
                   style={{ animationDelay: '0ms' }}></div>
              <div className={`w-2 h-2 ${stageStyles.dots} rounded-full opacity-30 blur-sm ${stageStyles.dotAnimation}`} 
                   style={{ animationDelay: '150ms' }}></div>
              <div className={`w-2 h-2 ${stageStyles.dots} rounded-full opacity-30 blur-sm ${stageStyles.dotAnimation}`} 
                   style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
        </div>
        <span className={`text-xs ${stageStyles.text} tracking-wide`}>{getTypingText()}</span>
      </div>
    );
  };

  const stageStyles = getStageStyles();

  return (
    <div className={`mr-auto max-w-[85%] rounded-lg px-3 py-2 text-sm transition-all duration-300 transform hover:scale-[1.02] border ${stageStyles.ringEffect} ${
      activities.length > 0 
        ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg shadow-blue-100/50' 
        : stageStyles.container
    }`}>
      {renderActivityContent()}
    </div>
  );
};

export default TypingIndicator; 