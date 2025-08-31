import React from 'react';
import {
  Button,
  Box,
  Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface ContractPartyProps {
  /**
   * Additional properties coming from the component registry. The only one we
   * rely on for now is the `command` (i.e. "Add" | "Edit") so the component
   * can be reused for both creating and editing a party.
   */
  properties: Record<string, unknown>;
}

/**
 * A simple button component that triggers the Add Party dialog via window event.
 */
const ContractParty: React.FC<ContractPartyProps> = ({ properties }) => {
  const command = (properties.command as string) ?? 'Add';

  // Handler to trigger the Add Party dialog
  const handleAddParty = () => {
    const event = new CustomEvent('OpenContractPartyDialog');
    window.dispatchEvent(event);
  };

  /* ----------------------------------------------------
   * UI
   * --------------------------------------------------*/
  return (
    <Box sx={{ my: 1 }}>
      <Typography variant="body1" sx={{ mb: 1 }}>
        {command} a party to the contract
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<PersonAddIcon />}
        onClick={handleAddParty}
        size="small"
      >
        {command} Party
      </Button>
    </Box>
  );
};

export default ContractParty;
