import React from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import type { ContractValidation, ContractEntity, Contract } from '../../../../types';

interface EntityOverviewProps {
  entity?: ContractEntity | null;
  contractData?: Contract | null;
  validations?: ContractValidation[];
  onSave?: (contractData: Contract) => void;
  isEditing?: boolean;
  onRefreshDocument?: () => Promise<void>;
  onEditToggle?: () => void;
  onCancel?: () => void;
}

const EntityOverview: React.FC<EntityOverviewProps> = ({
  entity,
  contractData,
  validations = [],
  onSave,
  isEditing = false,
  onRefreshDocument,
  onEditToggle,
  onCancel,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'review_required':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Count validations by severity
  const criticalCount = validations.filter(v => v.severity === 0).length;
  const warningCount = validations.filter(v => v.severity === 1).length;
  const suggestionCount = validations.filter(v => v.severity === 2).length;
  
  // Determine overall status
  const getOverallStatus = () => {
    if (criticalCount > 0) return { status: 'Critical Issues', color: 'error', icon: <ErrorIcon /> };
    if (warningCount > 0) return { status: 'Warnings Present', color: 'warning', icon: <WarningIcon /> };
    if (suggestionCount > 0) return { status: 'Suggestions Available', color: 'info', icon: <InfoIcon /> };
    return { status: 'All Good', color: 'success', icon: <CheckIcon /> };
  };

  const overallStatus = getOverallStatus();

  if (!contractData && !entity) {
    return null;
  }

  return (
    <Box sx={{ 
      backgroundColor: '#FEFEFE',
      border: '1px solid #F1F3F4',
      borderRadius: 3,
      mb: 4,
      boxShadow: '0 2px 12px rgba(46, 52, 64, 0.04)',
      overflow: 'hidden'
    }}>
      {/* Main Content */}
      <Box sx={{ p: 4, pt: 6 }}>
        {/* Contract Title & Basic Info */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600,
                  color: '#2E3440',
                  mb: 2,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em'
                }}
              >
                {contractData?.title || entity?.title || 'Untitled Contract'}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
                    color: '#80868B',
                    fontSize: '0.8rem',
                    fontWeight: 400,
                    letterSpacing: '0.05em',
                    px: 2,
                    py: 0.5,
                    backgroundColor: '#F8F9FA',
                    borderRadius: 1,
                    border: '1px solid #F1F3F4'
                  }}
                >
                  {contractData?.id || entity?.id}
                </Typography>
                
                {entity && (
                  <Box sx={{
                    px: 3,
                    py: 1,
                    backgroundColor: getStatusColor(entity.status) === 'success' ? '#F0F8F0' : 
                                   getStatusColor(entity.status) === 'warning' ? '#FFF9E6' :
                                   getStatusColor(entity.status) === 'info' ? '#F0F7FF' : '#FFF0F0',
                    color: getStatusColor(entity.status) === 'success' ? '#A3BE8C' : 
                           getStatusColor(entity.status) === 'warning' ? '#B8860B' :
                           getStatusColor(entity.status) === 'info' ? '#5E81AC' : '#BF616A',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: getStatusColor(entity.status) === 'success' ? '#B8CCA3' : 
                                getStatusColor(entity.status) === 'warning' ? '#F0D49C' :
                                getStatusColor(entity.status) === 'info' ? '#9BCAD7' : '#CC7B83',
                  }}>
                    {entity.status.replace('_', ' ')}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ ml: 4 }}>
              {!isEditing ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                    onClick={() => onEditToggle?.()}
                    variant="outlined"
                    sx={{ 
                      color: '#556B7D',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      px: 4,
                      py: 1.5,
                      borderColor: '#E8EAED',
                      backgroundColor: 'transparent',
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(46, 52, 64, 0.02)',
                        borderColor: '#D1D5DB',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(46, 52, 64, 0.08)'
                      }
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    startIcon={<RefreshIcon sx={{ fontSize: 18 }} />}
                    onClick={() => onRefreshDocument?.()}
                    variant="outlined"
                    sx={{ 
                      color: '#556B7D',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      px: 4,
                      py: 1.5,
                      borderColor: '#E8EAED',
                      backgroundColor: 'transparent',
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(46, 52, 64, 0.02)',
                        borderColor: '#D1D5DB',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(46, 52, 64, 0.08)'
                      }
                    }}
                  >
                    Refresh
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    startIcon={<SaveIcon sx={{ fontSize: 18 }} />}
                    onClick={() => contractData && onSave?.(contractData)}
                    variant="contained"
                    sx={{ 
                      backgroundColor: '#A3BE8C',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(163, 190, 140, 0.25)',
                      '&:hover': {
                        backgroundColor: '#8CA176',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 16px rgba(163, 190, 140, 0.35)'
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    startIcon={<CancelIcon sx={{ fontSize: 18 }} />}
                    onClick={() => onCancel?.()}
                    variant="outlined"
                    sx={{ 
                      color: '#BF616A',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      px: 4,
                      py: 1.5,
                      borderColor: '#CC7B83',
                      backgroundColor: 'transparent',
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(191, 97, 106, 0.08)',
                        borderColor: '#BF616A',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(191, 97, 106, 0.15)'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

        </Box>

        {/* Document Analysis */}
        <Box>


          <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Overall Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {React.cloneElement(overallStatus.icon, { 
                sx: { 
                  fontSize: 20, 
                  color: overallStatus.color === 'success' ? '#A3BE8C' : 
                         overallStatus.color === 'warning' ? '#EBCB8B' :
                         overallStatus.color === 'error' ? '#BF616A' : '#88C0D0'
                } 
              })}
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#2E3440',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  letterSpacing: '-0.01em'
                }}
              >
                {overallStatus.status}
              </Typography>
            </Box>

            {/* Issue Counts */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {/* Critical */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                backgroundColor: criticalCount > 0 ? '#FFF0F0' : '#F8F9FA',
                color: criticalCount > 0 ? '#BF616A' : '#80868B',
                px: 2,
                py: 1,
                borderRadius: 2,
                fontSize: '0.75rem',
                fontWeight: 500,
                border: '1px solid',
                borderColor: criticalCount > 0 ? '#CC7B83' : '#F1F3F4',
                transition: 'all 0.2s ease-in-out'
              }}>
                <ErrorIcon sx={{ 
                  fontSize: 14, 
                  color: 'inherit'
                }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'inherit',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {criticalCount} Critical
                </Typography>
              </Box>

              {/* Warnings */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                backgroundColor: warningCount > 0 ? '#FFF9E6' : '#F8F9FA',
                color: warningCount > 0 ? '#B8860B' : '#80868B',
                px: 2,
                py: 1,
                borderRadius: 2,
                fontSize: '0.75rem',
                fontWeight: 500,
                border: '1px solid',
                borderColor: warningCount > 0 ? '#F0D49C' : '#F1F3F4',
                transition: 'all 0.2s ease-in-out'
              }}>
                <WarningIcon sx={{ 
                  fontSize: 14, 
                  color: 'inherit'
                }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'inherit',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {warningCount} Warnings
                </Typography>
              </Box>

              {/* Suggestions */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                backgroundColor: suggestionCount > 0 ? '#F0F7FF' : '#F8F9FA',
                color: suggestionCount > 0 ? '#5E81AC' : '#80868B',
                px: 2,
                py: 1,
                borderRadius: 2,
                fontSize: '0.75rem',
                fontWeight: 500,
                border: '1px solid',
                borderColor: suggestionCount > 0 ? '#9BCAD7' : '#F1F3F4',
                transition: 'all 0.2s ease-in-out'
              }}>
                <InfoIcon sx={{ 
                  fontSize: 14, 
                  color: 'inherit'
                }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'inherit',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {suggestionCount} Suggestions
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default EntityOverview;