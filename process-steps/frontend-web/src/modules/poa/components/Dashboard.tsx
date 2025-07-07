import React from 'react';
import { ModuleDashboard } from '../../';
import { getModuleById } from '../../modules';
import { steps } from '../steps';

const PoaDashboard: React.FC = () => {
  const poaModule = getModuleById('poa');
  
  if (!poaModule) {
    return <div>Module not found</div>;
  }

  // Get the first step slug from the POA steps
  const firstStepSlug = steps.length > 0 ? steps[0].slug : 'scope';

  return (
    <ModuleDashboard 
      module={poaModule}
      firstStepSlug={firstStepSlug}
    />
  );
};

export default PoaDashboard; 