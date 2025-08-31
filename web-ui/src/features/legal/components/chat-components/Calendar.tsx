import React, { useState } from 'react';
import {
  Button,
  Box,
  Typography,
  TextField,
  Paper,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { format, parseISO } from 'date-fns';

interface CalendarProps {
  properties: Record<string, unknown>;
}

const Calendar: React.FC<CalendarProps> = ({ properties }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');

  const field = properties.field as string || 'date';

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const handleSubmit = () => {
    if (selectedDate) {
      const parsedDate = parseISO(selectedDate);
      const formattedDate = format(parsedDate, 'MMMM d, yyyy');
      
      const message = `I would like to set the ${field} to ${formattedDate}.`;

      // Send message to chat using generic SendChat event
      const sendChatEvent = new CustomEvent('SendChat', {
        detail: {
          message: message,
        }
      });
      
      window.dispatchEvent(sendChatEvent);
      
      // Clear the selected date after sending
      setSelectedDate('');
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        my: 1, 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
          Select {field}
        </Typography>
      </Box>

      <TextField
        fullWidth
        type="date"
        label={`Select ${field}`}
        value={selectedDate}
        onChange={handleDateChange}
        InputLabelProps={{
          shrink: true,
        }}
        size="small"
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!selectedDate}
          startIcon={<CalendarTodayIcon />}
          size="small"
        >
          Set Date
        </Button>
      </Box>
    </Paper>
  );
};

export default Calendar;