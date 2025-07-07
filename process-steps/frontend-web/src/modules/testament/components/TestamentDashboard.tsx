import React from 'react';
import ModuleDashboard from '../../components/ModuleDashboard';
import { getModuleById } from '../../modules';

const TestamentDashboard: React.FC = () => {
  const testamentModule = getModuleById('testament');
  
  if (!testamentModule) {
    return <div>Module not found</div>;
  }

  // Default first step for testament (can be customized later)
  const firstStepSlug = 'scope';

  return (
    <ModuleDashboard 
      module={testamentModule}
      firstStepSlug={firstStepSlug}
    />
  );
};

export default TestamentDashboard; 