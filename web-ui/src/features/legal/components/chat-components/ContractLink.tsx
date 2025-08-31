import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArticleIcon from '@mui/icons-material/Article';

interface ContractLinkProps {
  properties: Record<string, unknown>;
}

const ContractLink: React.FC<ContractLinkProps> = ({ properties }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const contractId = properties.id as string;
    if (contractId) {
      navigate(`/legal/assistant/${contractId}`);
    }
  };

  // Don't render if no id is provided
  if (!properties.id) {
    console.warn('[ContractLink] No contract id provided');
    return null;
  }

  return (
    <Box sx={{ my: 1 }}>
      <Typography variant="body1" sx={{ mb: 1 }}>
        Click here to view the newly created contract document
      </Typography>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<ArticleIcon />}
        onClick={handleClick}
      >
        View Contract
      </Button>
    </Box>
  );
};

export default ContractLink;