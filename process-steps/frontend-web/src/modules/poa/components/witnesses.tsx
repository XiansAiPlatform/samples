import React, { useState, useCallback } from 'react';
import { Witness } from './witnesses/types/witness.types';
import WitnessesHeader from './witnesses/components/WitnessesHeader';
import WitnessCard from './witnesses/components/WitnessCard';
import AddWitnessCard from './witnesses/components/AddWitnessCard';
import { getThemeColors } from '../../../components/theme';

const Witnesses: React.FC = () => {
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Get theme colors using the custom color palette
  const theme = getThemeColors('purple');  // Primary purple theme
  const errorTheme = getThemeColors('error');  // Semantic error theme
  const warningTheme = getThemeColors('warning');  // Semantic warning theme

  const addWitness = useCallback((newWitness: Omit<Witness, 'id'>) => {
    const witness: Witness = {
      ...newWitness,
      id: Date.now().toString()
    };
    setWitnesses(prev => [...prev, witness]);
    // Start editing the new witness
    setEditingIndex(witnesses.length);
  }, [witnesses.length]);

  const updateWitness = useCallback((index: number, updatedWitness: Omit<Witness, 'id'>) => {
    setWitnesses(prev => prev.map((w, i) => 
      i === index ? { ...updatedWitness, id: w.id } : w
    ));
  }, []);

  const removeWitness = useCallback((index: number) => {
    setWitnesses(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }, [editingIndex]);

  const toggleEditMode = useCallback((index: number) => {
    setEditingIndex(editingIndex === index ? null : index);
  }, [editingIndex]);

  const handleExitEdit = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const saveWitnesses = useCallback(() => {
    // TODO: Implement save functionality
    console.log('Saving witnesses:', witnesses);
    // You can add API call here to save witnesses
  }, [witnesses]);

  // Filter witnesses to show only those with data or currently being edited
  const shouldDisplayWitness = (witness: Witness, index: number): boolean => {
    // Always show if editing
    if (editingIndex === index) return true;
    // Show if has name (main required field)
    return witness.name.trim().length > 0;
  };

  const displayedWitnesses = witnesses.filter((witness, index) => 
    shouldDisplayWitness(witness, index)
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <WitnessesHeader
        witnesses={witnesses}
        onSave={saveWitnesses}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 lg:p-6 mx-4 sm:mx-6 lg:mx-8">
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
            
            {/* Witnesses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 max-h-[75vh] sm:max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
              {displayedWitnesses.map((witness, displayIndex) => {
                // Find the original index in the full witnesses array
                const originalIndex = witnesses.findIndex(w => w === witness);
                const isEditing = editingIndex === originalIndex;
                const canRemove = true;
                
                return (
                  <WitnessCard
                    key={originalIndex}
                    witness={witness}
                    index={originalIndex}
                    isEditing={isEditing}
                    canRemove={canRemove}
                    onToggleEdit={toggleEditMode}
                    onUpdate={updateWitness}
                    onRemove={removeWitness}
                    onExitEdit={handleExitEdit}
                  />
                );
              })}
              
              {/* Add Witness Card */}
              <AddWitnessCard onAdd={addWitness} />
            </div>

            {/* Requirements Notice */}
            <div className={`${theme.bgLight} ${theme.border} border rounded-lg p-4 mt-6`}>
              <h4 className={`text-sm font-medium ${theme.text} mb-2`}>Witness Requirements</h4>
              <ul className={`text-sm ${theme.text} space-y-1`}>
                <li>• Witnesses must be at least 18 years old</li>
                <li>• Witnesses should be independent parties (not beneficiaries)</li>
                <li>• All witnesses must be present during document signing</li>
                <li>• Valid identification will be required from all witnesses</li>
              </ul>
            </div>
            
            {/* Add bottom padding to ensure content is not hidden by footer */}
            <div className="pb-16 sm:pb-20"></div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Witnesses; 