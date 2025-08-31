import React, { useState, useMemo } from 'react';
import {
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Stack,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  useTheme,
  Badge,
} from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface ContractTermsProps {
  /**
   * Additional properties coming from the component registry.
   * Expected to contain a 'terms' array with contract term data.
   */
  properties: Record<string, unknown>;
}

/**
 * Contract term model matching the backend structure.
 */
export interface TermData {
  id: string;
  category: number;
  text: string;
}

/**
 * Category mappings for contract terms.
 */
const termCategories: Record<number, string> = {
  0: 'Payment Terms',
  1: 'Performance Terms',
  2: 'Liability Terms',
  3: 'Duration/Term',
  4: 'Termination',
  5: 'Confidentiality',
  6: 'Non-Compete',
  7: 'Non-Solicitation',
  8: 'Disclosure',
  11: 'Governing Law',
  12: 'Renewal',
  13: 'Entire Agreement',
  14: 'Force Majeure',
};

/**
 * A contract terms selector component designed with Nordic aesthetics.
 * Allows users to select from predefined contract terms organized by category.
 * Limited to a maximum of 5 terms per selection.
 */
const ContractTerms: React.FC<ContractTermsProps> = ({ properties }) => {
  const [open, setOpen] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
  const theme = useTheme();

  // Maximum number of terms that can be selected
  const MAX_SELECTIONS = 5;

  // Parse terms from properties
  const terms = useMemo(() => {
    const termsData = properties.terms as TermData[] | undefined;
    return termsData || [];
  }, [properties.terms]);

  // Group terms by category
  const groupedTerms = useMemo(() => {
    const groups: Record<number, TermData[]> = {};
    terms.forEach(term => {
      if (!groups[term.category]) {
        groups[term.category] = [];
      }
      groups[term.category].push(term);
    });
    return groups;
  }, [terms]);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setSelectedTerms(new Set());
  };

  const handleTermToggle = (termId: string) => {
    setSelectedTerms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(termId)) {
        // Always allow deselection
        newSet.delete(termId);
      } else {
        // Only allow selection if under the limit
        if (newSet.size < MAX_SELECTIONS) {
          newSet.add(termId);
        }
      }
      return newSet;
    });
  };

  const handleSelectAll = (categoryTerms: TermData[]) => {
    const categoryTermIds = categoryTerms.map(term => term.id);
    const allSelected = categoryTermIds.every(id => selectedTerms.has(id));
    
    setSelectedTerms(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all in this category
        categoryTermIds.forEach(id => newSet.delete(id));
      } else {
        // Select terms in this category up to the maximum limit
        for (const id of categoryTermIds) {
          if (newSet.size >= MAX_SELECTIONS) break;
          newSet.add(id);
        }
      }
      return newSet;
    });
  };

  const handleDone = () => {
    if (selectedTerms.size === 0) {
      return;
    }

    // Get selected term objects
    const selectedTermObjects = terms.filter(term => selectedTerms.has(term.id));
    
    // Group selected terms by category for the message
    const selectedByCategory: Record<number, TermData[]> = {};
    selectedTermObjects.forEach(term => {
      if (!selectedByCategory[term.category]) {
        selectedByCategory[term.category] = [];
      }
      selectedByCategory[term.category].push(term);
    });

    // Compose a human-friendly chat message for the agent
    const messageLines: string[] = [
      `Add Contract Terms – Please add the following ${selectedTerms.size} selected terms to the current contract:\n`,
    ];

    Object.entries(selectedByCategory).forEach(([categoryId, categoryTerms]) => {
      const categoryName = termCategories[parseInt(categoryId)] || `Category ${categoryId}`;
      messageLines.push(`**${categoryName}:**`);
      categoryTerms.forEach((term, idx) => {
        messageLines.push(`   ${idx + 1}. [ID:${term.id}] - ${term.text}`);
      });
      messageLines.push('');
    });

    messageLines.push('Please update the contract document to include these terms.');

    const message = messageLines.join('\n');

    const sendChatEvent = new CustomEvent('SendChat', {
      detail: {
        message,
        data: {
          command: 'Add',
          terms: selectedTermObjects,
          termCount: selectedTerms.size,
        },
      },
    });

    window.dispatchEvent(sendChatEvent);
    handleClose();
  };

  const isFormValid = selectedTerms.size > 0;

  const renderCategorySection = (categoryId: number, categoryTerms: TermData[]) => {
    const categoryName = termCategories[categoryId] || `Category ${categoryId}`;
    const selectedInCategory = categoryTerms.filter(term => selectedTerms.has(term.id)).length;
    const allSelected = selectedInCategory === categoryTerms.length;
    const canSelectMore = selectedTerms.size < MAX_SELECTIONS;
    const hasSelectableTerms = categoryTerms.some(term => !selectedTerms.has(term.id)) && canSelectMore;

    return (
      <Accordion key={categoryId} defaultExpanded={categoryId <= 2}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900],
            '&:hover': {
              backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[800],
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {categoryName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedInCategory > 0 && (
                <Chip
                  label={`${selectedInCategory}/${categoryTerms.length} selected`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              <Button
                size="small"
                variant="text"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAll(categoryTerms);
                }}
                disabled={!allSelected && !hasSelectableTerms}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            {categoryTerms.map((term) => {
              const isSelected = selectedTerms.has(term.id);
              const isDisabled = !isSelected && selectedTerms.size >= MAX_SELECTIONS;
              
              return (
                <Paper
                  key={term.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: isSelected
                      ? theme.palette.action.selected
                      : 'transparent',
                    border: isSelected
                      ? `1px solid ${theme.palette.primary.main}`
                      : undefined,
                    opacity: isDisabled ? 0.6 : 1,
                    '&:hover': {
                      backgroundColor: isDisabled
                        ? 'transparent'
                        : isSelected
                        ? theme.palette.action.selected
                        : theme.palette.action.hover,
                    },
                  }}
                >
              
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleTermToggle(term.id)}
                      disabled={isDisabled}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                      {term.text}
                    </Typography>
                  }
                  sx={{ margin: 0, alignItems: 'flex-start' }}
                />
              </Paper>
              );
            })}
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <>
      <Box sx={{ my: 1 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Add contract terms from predefined templates
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArticleIcon />}
          onClick={handleOpen}
          size="small"
          disabled={terms.length === 0}
        >
          <Badge badgeContent={terms.length} color="secondary" max={99}>
            Select Terms
          </Badge>
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Select Contract Terms (Max {MAX_SELECTIONS})</span>
            <Chip
              label={`${selectedTerms.size}/${MAX_SELECTIONS} selected`}
              color={selectedTerms.size >= MAX_SELECTIONS ? "warning" : "primary"}
              variant="outlined"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose up to {MAX_SELECTIONS} contract terms to add to your document. Terms are organized by category for easy browsing.
          </Typography>

          {terms.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No contract terms available
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1}>
              {Object.entries(groupedTerms)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([categoryId, categoryTerms]) =>
                  renderCategorySection(parseInt(categoryId), categoryTerms)
                )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Box sx={{ flex: 1 }}>
            {selectedTerms.size >= MAX_SELECTIONS && (
              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                ⚠️ Only 5 terms can be selected at a time.
              </Typography>
            )}
          </Box>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleDone} variant="contained" disabled={!isFormValid}>
            Add Selected Terms ({selectedTerms.size})
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContractTerms;
