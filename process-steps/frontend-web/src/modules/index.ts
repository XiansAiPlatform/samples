// Main modules configuration
export { 
  modules, 
  getModuleById, 
  getModuleBySlug, 
  getModuleUrl, 
  getModuleDashboardUrl, 
  getModuleEntityUrl 
} from './modules';

// Module interfaces
export type { Module } from './modules';

// Module-specific exports
export { default as PoaDashboard } from './poa/components/Dashboard';
export { default as TestamentDashboard } from './testament/components/TestamentDashboard';
export { default as ModuleDashboard } from './components/ModuleDashboard';
export { default as ModuleLayout } from './components/ModuleLayout';
export { default as DynamicModuleRoute } from './components/DynamicModuleRoute'; 