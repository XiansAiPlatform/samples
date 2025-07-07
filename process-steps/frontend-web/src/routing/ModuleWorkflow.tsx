import React from 'react';
import { EntityProvider } from '../context/EntityContext';
import MainLayout from '../components/layout/MainLayout';

const ModuleWorkflow: React.FC = () => (
  <EntityProvider>
    <MainLayout />
  </EntityProvider>
);

export default ModuleWorkflow; 