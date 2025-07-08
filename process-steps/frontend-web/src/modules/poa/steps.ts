import type { StepDefinition, Agent } from '../../components/types';

// Base URL configuration for Power of Attorney workflow
export const POA_BASE_URL = '/poa';
export const POA_ROUTE_PATTERN = `${POA_BASE_URL}/:documentId/:stepSlug`;

const AGENT = "Power of Attorney Agent v1.2";

// Agents collection - separated from steps for better management and websocket connections
export const Agents: Agent[] = [
  {
    id: "representative_bot",
    title: "Representative Bot",
    description: "Assist with onboarding",
    workflowType: `${AGENT}:Representative Bot`,
    suggestions: [
      "What is the status?",
      "What can you do?"
    ]
  },
  {
    id: "document_data_flow",
    title: "Document Data Flow",
    description: "Assist with document data fetching",
    workflowType: `${AGENT}:Document Data Flow`
  }
];

// Step definitions without themes - now using module-level theming
export const steps: StepDefinition[] = [
  {
    title: "Scope",
    slug: "scope",
    componentLoader: () => import('./components/documentScope').then(m => m.default)
  },
  {
    title: "Representatives",
    slug: "representatives",
    botId: "representative_bot",
    componentLoader: () => import('./components/representatives/representatives').then(m => m.default)
  },
  {
    title: "Conditions",
    slug: "conditions",
    botId: "representative_bot",
    componentLoader: () => import('./components/conditions/components/conditions').then(m => m.default)
  },
  {
    title: "Witnesses",
    slug: "witnesses",
    botId: "representative_bot",
    componentLoader: () => import('./components/witnesses').then(m => m.default)
  },
  {
    title: "Submit",
    slug: "submit",
    componentLoader:  () => import('./components/submitDocument').then(m => m.default)
  }
];

export default steps; 