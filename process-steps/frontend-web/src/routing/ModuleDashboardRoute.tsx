import React, { useState, useEffect } from 'react';
import { modules } from '../modules/modules';
import ModuleLayout from '../components/modules/ModuleLayout';

interface ModuleDashboardRouteProps {
  moduleSlug: string;
}

const ModuleDashboardRoute: React.FC<ModuleDashboardRouteProps> = ({ moduleSlug }) => {
  const [ModuleComponent, setModuleComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModule = async () => {
      try {
        setLoading(true);
        setError(null);

        // Find the module by slug
        const module = modules.find(m => m.slug === moduleSlug);
        
        if (!module) {
          setError(`Module "${moduleSlug}" not found`);
          setLoading(false);
          return;
        }

        // Load the component dynamically
        const Component = await module.componentLoader();
        setModuleComponent(() => Component);
        setLoading(false);
      } catch (err) {
        console.error(`Failed to load module ${moduleSlug}:`, err);
        setError(`Failed to load module "${moduleSlug}"`);
        setLoading(false);
      }
    };

    loadModule();
  }, [moduleSlug]);

  if (loading) {
    return (
      <ModuleLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading module...</p>
          </div>
        </div>
      </ModuleLayout>
    );
  }

  if (error || !ModuleComponent) {
    return (
      <ModuleLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 text-lg font-medium mb-2">Error</p>
            <p className="text-neutral-600">{error || 'Failed to load module'}</p>
          </div>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout>
      <ModuleComponent />
    </ModuleLayout>
  );
};

export default ModuleDashboardRoute; 