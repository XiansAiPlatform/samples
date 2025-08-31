import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  AutoAwesome as GenerateIcon,
} from '@mui/icons-material';

interface ContractDescriptionProps {
  properties: Record<string, unknown>;
}

const ContractDescription: React.FC<ContractDescriptionProps> = () => {
  const [description, setDescription] = useState('');

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value);
  };

  const handleSetDescription = () => {
    if (!description.trim()) {
      return;
    }

    const message = `Set the contract description to: "${description.trim()}"`;

    // Send message to chat using the SendChat event
    const sendChatEvent = new CustomEvent('SendChat', {
      detail: {
        message: message,
        data: {
          command: 'SetDescription',
          description: description.trim(),
        },
      },
    });

    window.dispatchEvent(sendChatEvent);
    setDescription(''); // Clear the input after sending
  };

  const handleGenerateFromKeywords = () => {
    if (!description.trim()) {
      return;
    }

    const message = `Please generate a description for a legal contract based on the following keywords and information: "${description.trim()}"`;

    // Send message to chat using the SendChat event
    const sendChatEvent = new CustomEvent('SendChat', {
      detail: {
        message: message,
        data: {
          command: 'GenerateContract',
          keywords: description.trim(),
        },
      },
    });

    window.dispatchEvent(sendChatEvent);
    setDescription(''); // Clear the input after sending
  };

  const isFormValid = description.trim().length > 0;

  return (
    <Card sx={{ my: 2, maxWidth: 600 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon />
          Contract Description
        </Typography>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Enter a description or keywords for your contract. 
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Description or Keywords"
          placeholder="Enter contract description or keywords here..."
          value={description}
          onChange={handleDescriptionChange}
          variant="outlined"
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DescriptionIcon />}
            onClick={handleSetDescription}
            disabled={!isFormValid}
            sx={{ flex: 1, minWidth: 120 }}
          >
            Set
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<GenerateIcon />}
            onClick={handleGenerateFromKeywords}
            disabled={!isFormValid}
            sx={{ flex: 1, minWidth: 120 }}
          >
            Generate
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ContractDescription;
