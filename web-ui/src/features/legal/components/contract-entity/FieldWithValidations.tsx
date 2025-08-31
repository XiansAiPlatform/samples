import React from 'react';
import { Box } from '@mui/material';
import type { ContractValidation } from '../../../../types';
import { ValidationAlert } from './ValidationAlert';

interface FieldWithValidationsProps {
  fieldPath: string;
  validations: ContractValidation[];
  children: React.ReactNode;
  onAskAgent?: (prompt: string) => void;
}

export const FieldWithValidations: React.FC<FieldWithValidationsProps> = ({ 
  fieldPath, 
  validations,
  children,
  onAskAgent
}) => {
  const fieldValidations = validations.filter(v => v.fieldPath === fieldPath);

  return (
    <Box>
      {children}
      {fieldValidations.map((validation, index) => (
        <ValidationAlert 
          key={index} 
          validation={validation} 
          onAskAgent={onAskAgent}
        />
      ))}
    </Box>
  );
};

export default FieldWithValidations;