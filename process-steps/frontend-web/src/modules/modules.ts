import React from 'react';

export type ComponentLoader = () => Promise<React.ComponentType>;

export interface Module {
  id: string;
  title: string;
  description: string;
  baseUrl: string;
  slug: string;
  icon?: string;
  color?: string;
  componentLoader: ComponentLoader;
}

// Module definitions for the application
export const modules: Module[] = [
  {
    id: "poa",
    title: "Power of Attorney",
    description: "Create and manage Power of Attorney documents",
    baseUrl: "/poa",
    slug: "poa",
    icon: "FiFileText",
    color: "purple",
    componentLoader: () => import('./poa/components/Dashboard').then(m => m.default)
  },
  {
    id: "testament",
    title: "Testament",
    description: "Create and manage Testament documents",
    baseUrl: "/testament",
    slug: "testament",
    icon: "FiFileText",
    color: "blue",
    componentLoader: () => import('./testament/components/TestamentDashboard').then(m => m.default)
  }
];

// Utility functions for working with modules
export const getModuleById = (id: string): Module | undefined => {
  return modules.find(module => module.id === id);
};

export const getModuleBySlug = (slug: string): Module | undefined => {
  return modules.find(module => module.slug === slug);
};

export const getModuleUrl = (module: Module): string => {
  return module.baseUrl;
};

export const getModuleDashboardUrl = (moduleSlug: string): string => {
  return `/${moduleSlug}`;
};

export const getModuleEntityUrl = (moduleSlug: string, entityId: string, stepSlug?: string): string => {
  if (stepSlug) {
    return `/${moduleSlug}/${entityId}/${stepSlug}`;
  }
  return `/${moduleSlug}/${entityId}`;
};

export default modules; 