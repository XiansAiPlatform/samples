import React, { useState } from 'react';
import { Condition } from '../../../services/DocumentService';
import { getThemeColors } from '../../../../../components/theme';

interface ConditionCardProps {
  condition: Condition;
  index: number;
  isEditing: boolean;
  canRemove: boolean;
  onToggleEdit: (index: number) => void;
  onUpdate: (index: number, condition: Omit<Condition, 'id'>) => void;
  onRemove: (index: number) => void;
  onExitEdit: () => void;
}

// Map numeric condition types to display labels
const getConditionTypeLabel = (type: number): string => {
  switch (type) {
    case 0: return 'Restriction';
    case 1: return 'Permission';
    case 2: return 'General';
    case 3: return 'Special';
    default: return 'Unknown';
  }
};

// Map numeric condition types to colors
const getConditionTypeColor = (type: number): string => {
  switch (type) {
    case 0: return 'bg-red-100 text-red-800'; // Restriction - red
    case 1: return 'bg-green-100 text-green-800'; // Permission - green
    case 2: return 'bg-blue-100 text-blue-800'; // General - blue
    case 3: return 'bg-purple-100 text-purple-800'; // Special - purple
    default: return 'bg-gray-100 text-gray-800';
  }
};

const ConditionCard: React.FC<ConditionCardProps> = ({
  condition,
  index,
  isEditing,
  canRemove,
  onToggleEdit,
  onUpdate,
  onRemove,
  onExitEdit
}) => {
  const [formData, setFormData] = useState({
    text: condition.text,
    type: condition.type,
    targetId: condition.targetId
  });

  const theme = getThemeColors('purple');
  const errorTheme = getThemeColors('error');

  const handleSave = () => {
    if (formData.text.trim()) {
      onUpdate(index, formData);
      onExitEdit();
    }
  };

  const handleCancel = () => {
    setFormData({
      text: condition.text,
      type: condition.type,
      targetId: condition.targetId
    });
    onExitEdit();
  };

  if (isEditing) {
    return (
      <div className="bg-white border-2 border-blue-300 rounded-lg p-4 mb-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition Text *
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the condition text..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              <option value={0}>Restriction</option>
              <option value={1}>Permission</option>
              <option value={2}>General</option>
              <option value={3}>Special</option>
            </select>
            
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!formData.text.trim()}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  formData.text.trim()
                    ? `${theme.buttonPrimary} text-white hover:${theme.buttonPrimaryHover}`
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-gray-900 font-medium mb-2 leading-relaxed">{condition.text}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getConditionTypeColor(condition.type)}`}>
                  {getConditionTypeLabel(condition.type)}
                </span>
                {condition.targetId && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                    Target: {condition.targetId.substring(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onToggleEdit(index)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit condition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          {canRemove && (
            <button
              onClick={() => onRemove(index)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Remove condition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConditionCard; 