import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getModuleBySlug } from '../modules/modules';
import { StepDefinition, StepTheme, StepBot } from '../components/types';

// Re-export types for convenience
export type { StepDefinition, StepTheme, StepBot };

interface StepsContextValue {
  steps: StepDefinition[];
  activeStep: number;
  documentId: string | undefined;
  setActiveStep: (index: number) => void;
  navigateToStep: (stepSlug: string) => void;
  navigateToStepByIndex: (index: number) => void;
  isInitialized: boolean;
}

// Create context with a default value to prevent undefined context issues
const defaultContextValue: StepsContextValue = {
  steps: [],
  activeStep: 0,
  documentId: undefined,
  setActiveStep: () => {},
  navigateToStep: () => {},
  navigateToStepByIndex: () => {},
  isInitialized: false
};

const StepsContext = createContext<StepsContextValue>(defaultContextValue);

export const StepsProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [steps, setSteps] = useState<StepDefinition[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Parse pathname directly since useParams doesn't work above Routes level
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isWorkflowRoute = pathSegments.length >= 3; // e.g., ['poa', 'documentId', 'stepSlug']
  const moduleSlug = pathSegments[0];
  const documentId = isWorkflowRoute ? pathSegments[1] : undefined;
  const stepSlug = isWorkflowRoute ? pathSegments[2] : undefined;
  
  // Debug logging for StepsContext
  console.log('[StepsContext] Route detection:', {
    pathname: location.pathname,
    pathSegments,
    isWorkflowRoute,
    moduleSlug,
    documentId,
    stepSlug
  });
  
  // Find the active step based on URL slug
  const getActiveStepFromSlug = (slug?: string, stepsList: StepDefinition[] = steps): number => {
    if (!slug || stepsList.length === 0) return 0;
    const stepIndex = stepsList.findIndex(step => step.slug === slug);
    return stepIndex >= 0 ? stepIndex : 0;
  };

  const [activeStep, setActiveStepState] = useState(0);

  // Load steps for current module only when on workflow routes
  useEffect(() => {
    const loadSteps = async () => {
      // Only load steps if we have documentId and stepSlug (workflow route)
      if (!moduleSlug || !documentId || !stepSlug) {
        // Clear steps for dashboard routes
        setSteps([]);
        setActiveStepState(0);
        setIsInitialized(true);
        return;
      }
      
      try {
        setIsInitialized(false);
        const module = getModuleBySlug(moduleSlug);
        if (!module) {
          console.warn(`Module not found for slug: ${moduleSlug}`);
          setSteps([]);
          setActiveStepState(0);
          setIsInitialized(true);
          return;
        }
        
        const { steps: moduleSteps } = await module.stepsLoader();
        setSteps(moduleSteps);
        
        // Set active step based on current URL
        const newActiveStep = getActiveStepFromSlug(stepSlug, moduleSteps);
        setActiveStepState(newActiveStep);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load steps for module:', moduleSlug, error);
        setSteps([]);
        setActiveStepState(0);
        setIsInitialized(true); // Still set as initialized to prevent infinite loading
      }
    };

    loadSteps();
  }, [moduleSlug, documentId, stepSlug, location.pathname]);

  // Update active step when URL changes
  useEffect(() => {
    if (steps.length > 0) {
      const newActiveStep = getActiveStepFromSlug(stepSlug);
      setActiveStepState(newActiveStep);
    }
  }, [stepSlug, steps]);

  const getStepUrl = (step: StepDefinition, docId?: string): string => {
    const module = getModuleBySlug(moduleSlug);
    if (!module || !docId) return '/';
    return `${module.baseUrl}/${docId}/${step.slug}`;
  };

  const getStepUrlBySlug = (slug: string, docId?: string): string => {
    const step = steps.find(s => s.slug === slug);
    if (!step) return '/';
    return getStepUrl(step, docId);
  };

  const navigateToStep = (stepSlug: string) => {
    if (navigate && documentId) {
      navigate(getStepUrlBySlug(stepSlug, documentId));
    }
  };

  const navigateToStepByIndex = (index: number) => {
    if (index >= 0 && index < steps.length && navigate && documentId) {
      const step = steps[index];
      navigate(getStepUrl(step, documentId));
    }
  };

  const setActiveStep = (index: number) => {
    navigateToStepByIndex(index);
  };

  const value: StepsContextValue = {
    steps,
    activeStep,
    documentId,
    setActiveStep,
    navigateToStep,
    navigateToStepByIndex,
    isInitialized,
  };

  return <StepsContext.Provider value={value}>{children}</StepsContext.Provider>;
};

export const useSteps = () => {
  const context = useContext(StepsContext);
  if (!context) {
    throw new Error('useSteps must be used within a StepsProvider');
  }
  return context;
}; 