export interface Representative {
  id?: string;
  fullName: string;
  nationalId: string;
  relationship: string;
  // Legacy fields for backward compatibility
  name?: string;
  role?: string;
  email?: string;
  organization?: string;
}

export interface RepresentativesState {
  representatives: Representative[];
  editingIndex: number | null;
} 