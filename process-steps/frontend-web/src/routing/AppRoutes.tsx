import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { modules } from '../modules/modules';
import DynamicModuleRoute from '../components/modules/DynamicModuleRoute';
import ModuleWorkflow from './ModuleWorkflow';

const AppRoutes: React.FC = () => {
  const defaultRoute = modules.length > 0 ? `/${modules[0].slug}` : '/poa';

  return (
    <Routes>
      {/* Redirect root to the first module dashboard */}
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      
      {/* Dynamic module dashboard routes */}
      {modules.map((module) => (
        <Route 
          key={module.id}
          path={`/${module.slug}`} 
          element={<DynamicModuleRoute moduleSlug={module.slug} />} 
        />
      ))}
      
      {/* Dynamic module workflow routes with document ID */}
      {modules.map((module) => (
        <Route 
          key={`${module.id}-workflow`}
          path={`${module.baseUrl}/:documentId/:stepSlug`} 
          element={<ModuleWorkflow />} 
        />
      ))}
      
      {/* Catch-all redirect to first module dashboard */}
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
};

export default AppRoutes; 