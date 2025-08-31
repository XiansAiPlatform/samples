import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Chip,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Article as TermsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { ContractEntity, ContractValidation, Contract, TermCategory, Party } from '../../../../types';
import { FieldWithValidations } from './FieldWithValidations';
import { ValidationAlert } from './ValidationAlert';
import { sendMessageToAgent } from './chatUtils';

export interface EntityDetailsProps {
  entity?: ContractEntity | null;
  contractData?: Contract | null;
  validations?: ContractValidation[];
  isEditing?: boolean;
  onContractChange?: (contractData: Contract) => void;
}

const EntityDetails: React.FC<EntityDetailsProps> = ({
  entity: propEntity,
  contractData: propContractData,
  validations: propValidations = [],
  isEditing = false,
  onContractChange,
}) => {
  const [entity, setEntity] = useState<ContractEntity | null>(propEntity || null);
  const [editableContract, setEditableContract] = useState<Contract | null>(null);

  // Use props for contract data and validations, fallback to entity data if props not provided
  const contractData = propContractData || entity?.data?.contract || null;
  const validations = propValidations.length > 0 ? propValidations : entity?.data?.validations || [];

  // Update entity when prop changes
  useEffect(() => {
    if (propEntity) {
      setEntity(propEntity);
    }
  }, [propEntity]);

  // Initialize editable contract when edit mode starts or contract data changes
  useEffect(() => {
    if (isEditing && contractData) {
      setEditableContract({ ...contractData });
    } else if (!isEditing) {
      setEditableContract(null);
    }
  }, [isEditing, contractData]);

  // Helper function to update editable contract and notify parent
  const updateEditableContract = (updates: Partial<Contract>) => {
    if (!editableContract) return;
    
    const updatedContract = { ...editableContract, ...updates };
    setEditableContract(updatedContract);
    onContractChange?.(updatedContract);
  };

  // Helper function to open contract party dialog
  const handleAddParty = () => {
    const event = new CustomEvent('OpenContractPartyDialog');
    window.dispatchEvent(event);
  };

  const removeParty = (partyId: string) => {
    if (!editableContract) return;
    
    updateEditableContract({
      parties: editableContract.parties.filter(p => p.id !== partyId)
    });
  };

  const updateParty = (partyId: string, updates: Partial<Party>) => {
    if (!editableContract) return;
    
    updateEditableContract({
      parties: editableContract.parties.map(p => 
        p.id === partyId ? { ...p, ...updates } : p
      )
    });
  };

  const addTerm = () => {
    if (!editableContract) return;
    
    const newTerm = {
      id: crypto.randomUUID(),
      category: 'General' as TermCategory,
      text: '',
    };
    
    updateEditableContract({
      terms: [...editableContract.terms, newTerm]
    });
  };

  const removeTerm = (termId: string) => {
    if (!editableContract) return;
    
    updateEditableContract({
      terms: editableContract.terms.filter(t => t.id !== termId)
    });
  };

  const updateTerm = (termId: string, updates: Partial<{ category: TermCategory; text: string }>) => {
    if (!editableContract) return;
    
    updateEditableContract({
      terms: editableContract.terms.map(t => 
        t.id === termId ? { ...t, ...updates } : t
      )
    });
  };





  const getTermCategoryLabel = (category: TermCategory): string => {
    switch (category) {
      case 'General': return 'General';
      case 'Payment': return 'Payment';
      case 'Delivery': return 'Delivery';
      case 'Warranty': return 'Warranty';
      case 'Liability': return 'Liability';
      case 'Termination': return 'Termination';
      case 'Confidentiality': return 'Confidentiality';
      case 'Intellectual_Property': return 'Intellectual Property';
      case 'Dispute_Resolution': return 'Dispute Resolution';
      case 'Compliance': return 'Compliance';
      default: return 'General';
    }
  };



  // Use editable contract in edit mode, otherwise use original contract data
  const displayContract = isEditing ? editableContract : contractData;

  if (!displayContract && !entity) {
    return null;
  }

  return (
    <Box sx={{ 
      backgroundColor: '#FEFEFE',
      borderRadius: 3,
      border: '1px solid #F1F3F4',
      boxShadow: '0 2px 12px rgba(46, 52, 64, 0.04)',
      overflow: 'hidden'
    }}>
      {/* Contract Content */}
      {displayContract && (
          <Box sx={{ p: 4, pt: 6 }}>
            {/* Contract Description */}
            <Box sx={{ mb: 6 }}>
              <Box sx={{ 
                mb: 4,
                pb: 2,
                borderBottom: '1px solid #F8F9FA',
                position: 'relative'
              }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 600,
                  color: '#2E3440',
                  letterSpacing: '-0.02em',
                  mb: 1
                }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#80868B',
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: '0.7rem'
                }}>
                  Contract Overview
                </Typography>
                <Box sx={{
                  position: 'absolute',
                  bottom: -1,
                  left: 0,
                  width: 32,
                  height: 2,
                  backgroundColor: '#5E81AC',
                  borderRadius: 1
                }} />
              </Box>
              <FieldWithValidations 
                fieldPath="description"
                validations={validations}
                onAskAgent={sendMessageToAgent}
              >
                {isEditing ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={displayContract.description || ''}
                    onChange={(e) => updateEditableContract({ description: e.target.value })}
                    placeholder="Enter contract description..."
                    variant="outlined"
                  />
                ) : displayContract.description ? (
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                    {displayContract.description}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No description provided
                  </Typography>
                )}
              </FieldWithValidations>
            </Box>

            <Divider sx={{ my: 6, borderColor: '#F1F3F4', borderWidth: '1px' }} />

            {/* Effective Date */}
            <Box sx={{ mb: 6 }}>
              <Box sx={{ 
                mb: 4,
                pb: 2,
                borderBottom: '1px solid #F8F9FA',
                position: 'relative'
              }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 600,
                  color: '#2E3440',
                  letterSpacing: '-0.02em',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}>
                  <CalendarIcon sx={{ fontSize: 20, color: '#5E81AC' }} />
                  Effective Date
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#80868B',
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: '0.7rem'
                }}>
                  Contract Activation
                </Typography>
                <Box sx={{
                  position: 'absolute',
                  bottom: -1,
                  left: 0,
                  width: 32,
                  height: 2,
                  backgroundColor: '#5E81AC',
                  borderRadius: 1
                }} />
              </Box>
              <FieldWithValidations 
                fieldPath="effectiveDate"
                validations={validations}
                onAskAgent={sendMessageToAgent}
              >
                {isEditing ? (
                  <TextField
                    type="date"
                    value={displayContract.effectiveDate ? displayContract.effectiveDate.split('T')[0] : ''}
                    onChange={(e) => updateEditableContract({ 
                      effectiveDate: e.target.value ? new Date(e.target.value).toISOString() : null 
                    })}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                  />
                ) : displayContract.effectiveDate ? (
                  <Typography variant="body1">
                    {new Date(displayContract.effectiveDate).toLocaleDateString()}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No effective date set
                  </Typography>
                )}
              </FieldWithValidations>
            </Box>

            <Divider sx={{ my: 6, borderColor: '#F1F3F4', borderWidth: '1px' }} />

            {/* Contract Parties */}
            <Box sx={{ mb: 6 }}>
              <Box sx={{ 
                mb: 4,
                pb: 2,
                borderBottom: '1px solid #F8F9FA',
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}>
                <Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 600,
                    color: '#2E3440',
                    letterSpacing: '-0.02em',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}>
                    <PersonIcon sx={{ fontSize: 20, color: '#5E81AC' }} />
                    Parties
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#80868B',
                    fontWeight: 400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: '0.7rem'
                  }}>
                    Contract Participants
                  </Typography>
                  <Box sx={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    width: 32,
                    height: 2,
                    backgroundColor: '#5E81AC',
                    borderRadius: 1
                  }} />
                </Box>
                {isEditing && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddParty}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      textTransform: 'none',
                      mb: 0.5,
                      borderColor: '#E8EAED',
                      color: '#556B7D',
                      '&:hover': {
                        borderColor: '#D1D5DB',
                        backgroundColor: 'rgba(46, 52, 64, 0.02)'
                      }
                    }}
                  >
                    Add Party
                  </Button>
                )}
              </Box>
              <FieldWithValidations 
                fieldPath="parties"
                validations={validations}
                onAskAgent={sendMessageToAgent}
              >
                {displayContract.parties && displayContract.parties.length > 0 ? (
                  <Box sx={{ display: 'grid', gap: 4 }}>
                    {displayContract.parties.map((party, index) => (
                      <Card key={party.id || index} variant="outlined" sx={{ 
                        backgroundColor: '#FCFCFC',
                        border: '1px solid #F1F3F4',
                        borderRadius: 2,
                        boxShadow: '0 1px 6px rgba(46, 52, 64, 0.03)',
                        '&:hover': {
                          border: '1px solid #E8EAED',
                          boxShadow: '0 2px 12px rgba(46, 52, 64, 0.06)',
                          transform: 'translateY(-1px)',
                          transition: 'all 0.2s ease-in-out'
                        }
                      }}>
                        <CardContent sx={{ p: 4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              {isEditing ? (
                                <Box sx={{ display: 'grid', gap: 2, mb: 2 }}>
                                  <TextField
                                    label="Party Name"
                                    value={party.name || ''}
                                    onChange={(e) => updateParty(party.id, { name: e.target.value })}
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                  />
                                  <TextField
                                    label="Role"
                                    value={party.role || ''}
                                    onChange={(e) => updateParty(party.id, { role: e.target.value })}
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                  />
                                </Box>
                              ) : (
                                <>
                                  <Typography variant="h6" sx={{ 
                                    fontWeight: 600,
                                    color: '#2E3440',
                                    mb: 0.5,
                                    letterSpacing: '-0.01em'
                                  }}>
                                    {party.name}
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    color: '#80868B',
                                    mb: 3,
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontSize: '0.75rem'
                                  }}>
                                    {party.role}
                                  </Typography>
                                </>
                              )}
                            </Box>
                            {isEditing && (
                              <IconButton 
                                onClick={() => removeParty(party.id)}
                                size="small"
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>

                          {/* Representatives */}
                          {party.representatives && party.representatives.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle2" sx={{ 
                                fontWeight: 600,
                                mb: 2,
                                color: '#374151',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.75rem'
                              }}>
                                Representatives
                              </Typography>
                              {party.representatives.map((person, personIndex) => (
                                <Box key={person.id || personIndex} sx={{ ml: 2, mb: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {person.name} {person.title && `(${person.title})`}
                                  </Typography>
                                  {person.email && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      Email: {person.email}
                                    </Typography>
                                  )}
                                  {person.phone && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      Phone: {person.phone}
                                    </Typography>
                                  )}
                                  {person.nationalId && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      ID: {person.nationalId}
                                    </Typography>
                                  )}
                                </Box>
                              ))}
                            </Box>
                          )}

                          {/* Signatories */}
                          {party.signatories && party.signatories.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" sx={{ 
                                fontWeight: 600,
                                mb: 2,
                                color: '#374151',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.75rem'
                              }}>
                                Signatories
                              </Typography>
                              {party.signatories.map((person, personIndex) => (
                                <Box key={person.id || personIndex} sx={{ ml: 2, mb: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {person.name} {person.title && `(${person.title})`}
                                  </Typography>
                                  {person.email && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      Email: {person.email}
                                    </Typography>
                                  )}
                                  {person.phone && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      Phone: {person.phone}
                                    </Typography>
                                  )}
                                  {person.nationalId && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      ID: {person.nationalId}
                                    </Typography>
                                  )}
                                </Box>
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No parties defined
                  </Typography>
                )}
              </FieldWithValidations>
            </Box>

            <Divider sx={{ my: 6, borderColor: '#F1F3F4', borderWidth: '1px' }} />

            {/* Contract Terms */}
            <Box sx={{ mb: 6 }}>
              <Box sx={{ 
                mb: 4,
                pb: 2,
                borderBottom: '1px solid #F8F9FA',
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}>
                <Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 600,
                    color: '#2E3440',
                    letterSpacing: '-0.02em',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}>
                    <TermsIcon sx={{ fontSize: 20, color: '#5E81AC' }} />
                    Terms & Conditions
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#80868B',
                    fontWeight: 400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: '0.7rem'
                  }}>
                    Contract Provisions
                  </Typography>
                  <Box sx={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    width: 32,
                    height: 2,
                    backgroundColor: '#5E81AC',
                    borderRadius: 1
                  }} />
                </Box>
                {isEditing && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addTerm}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      textTransform: 'none',
                      mb: 0.5,
                      borderColor: '#E8EAED',
                      color: '#556B7D',
                      '&:hover': {
                        borderColor: '#D1D5DB',
                        backgroundColor: 'rgba(46, 52, 64, 0.02)'
                      }
                    }}
                  >
                    Add Term
                  </Button>
                )}
              </Box>
              <FieldWithValidations 
                fieldPath="terms"
                validations={validations}
                onAskAgent={sendMessageToAgent}
              >
                {displayContract.terms && displayContract.terms.length > 0 ? (
                  <Box sx={{ display: 'grid', gap: 4 }}>
                    {displayContract.terms.map((term, index) => (
                      <Card key={term.id || index} variant="outlined" sx={{
                        backgroundColor: '#FCFCFC',
                        border: '1px solid #F1F3F4',
                        borderRadius: 2,
                        boxShadow: '0 1px 6px rgba(46, 52, 64, 0.03)',
                        '&:hover': {
                          border: '1px solid #E8EAED',
                          boxShadow: '0 2px 12px rgba(46, 52, 64, 0.06)',
                          transform: 'translateY(-1px)',
                          transition: 'all 0.2s ease-in-out'
                        }
                      }}>
                        <CardContent sx={{ p: 4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 600,
                              color: '#2E3440',
                              letterSpacing: '-0.01em'
                            }}>
                              Term #{index + 1}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isEditing ? (
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                  <Select
                                    value={term.category}
                                    onChange={(e) => updateTerm(term.id, { category: e.target.value as TermCategory })}
                                  >
                                    <MenuItem value="General">General</MenuItem>
                                    <MenuItem value="Payment">Payment</MenuItem>
                                    <MenuItem value="Delivery">Delivery</MenuItem>
                                    <MenuItem value="Warranty">Warranty</MenuItem>
                                    <MenuItem value="Liability">Liability</MenuItem>
                                    <MenuItem value="Termination">Termination</MenuItem>
                                    <MenuItem value="Confidentiality">Confidentiality</MenuItem>
                                    <MenuItem value="Intellectual_Property">Intellectual Property</MenuItem>
                                    <MenuItem value="Dispute_Resolution">Dispute Resolution</MenuItem>
                                    <MenuItem value="Compliance">Compliance</MenuItem>
                                  </Select>
                                </FormControl>
                              ) : (
                                <Chip
                                  label={getTermCategoryLabel(term.category)}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              )}
                              {isEditing && (
                                <IconButton 
                                  onClick={() => removeTerm(term.id)}
                                  size="small"
                                  sx={{ color: 'error.main' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                          {isEditing ? (
                            <TextField
                              multiline
                              rows={4}
                              fullWidth
                              value={term.text || ''}
                              onChange={(e) => updateTerm(term.id, { text: e.target.value })}
                              placeholder="Enter term content..."
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {term.text}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No terms and conditions defined
                  </Typography>
                )}
              </FieldWithValidations>
            </Box>

            {/* Global Validations (for fields not displayed above) */}
            {validations.filter(v => !['title', 'description', 'effectiveDate', 'parties', 'terms'].includes(v.fieldPath)).length > 0 && (
              <>
                <Divider sx={{ my: 6, borderColor: '#F1F3F4', borderWidth: '1px' }} />
                <Box sx={{ 
                  mb: 4,
                  p: 3,
                  backgroundColor: '#FFF9E6',
                  border: '1px solid #F0D49C',
                  borderRadius: 2,
                  borderLeft: '4px solid #EBCB8B'
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 500,
                    color: '#B8860B',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <WarningIcon sx={{ fontSize: 18, color: '#EBCB8B' }} />
                    Additional Validations
                  </Typography>
                  {validations
                    .filter(v => !['title', 'description', 'effectiveDate', 'parties', 'terms'].includes(v.fieldPath))
                    .map((validation, index) => (
                      <ValidationAlert 
                        key={index} 
                        validation={validation} 
                        onAskAgent={sendMessageToAgent}
                      />
                    ))}
                </Box>
              </>
            )}
          </Box>
        )}
    </Box>
  );
};

export default EntityDetails;