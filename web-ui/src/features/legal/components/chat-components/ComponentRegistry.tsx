import React from 'react';
import ContractLink from './ContractLink';
import ContractParty from './ContractParty';
import ContractTerms from './ContractTerms';
import Calendar from './Calendar';
import ContractDescription from './ContractDescription';
import PieChart from './PieChart';

export interface UIComponentRef {
  name: string;
  properties: Record<string, unknown>;
}

export interface UIComponentProps {
  properties: Record<string, unknown>;
}

// Registry mapping component names to their implementations
const componentRegistry: Record<string, React.FC<UIComponentProps>> = {
  ContractLink,
  ContractParty,
  ContractTerms,
  Calendar,
  ContractDescription,
  PieChart,
  // Add more components here as needed
  // ExampleComponent: ExampleComponent,
};

interface UIComponentRendererProps {
  data: UIComponentRef;
}

const UIComponentRenderer: React.FC<UIComponentRendererProps> = ({ data }) => {
  const Component = componentRegistry[data.name];

  if (!Component) {
    console.warn(`[UIComponentRenderer] Unknown component: ${data.name}`);
    return null;
  }

  return <Component properties={data.properties} />;
};

export default UIComponentRenderer;