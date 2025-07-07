import React from 'react';
import { FiInfo, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { FindingType } from './components/FindingsPane';

// Finding type icons and colors for UI components
export const FINDING_TYPE_INFO: Record<FindingType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  error: { icon: React.createElement(FiXCircle), color: 'text-red-600', bgColor: 'bg-red-100' },
  warning: { icon: React.createElement(FiAlertTriangle), color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  suggestion: { icon: React.createElement(FiInfo), color: 'text-blue-600', bgColor: 'bg-blue-100' }
}; 