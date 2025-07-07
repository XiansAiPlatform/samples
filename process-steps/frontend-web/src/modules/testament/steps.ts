import type { StepDefinition, Agent } from '../../components/types';

// Base URL configuration for Testament workflow
export const TESTAMENT_BASE_URL = '/testament';
export const TESTAMENT_ROUTE_PATTERN = `${TESTAMENT_BASE_URL}/:documentId/:stepSlug`;

const AGENT = "Testament Agent v1.0";

// Agents collection - separated from steps for better management and websocket connections
export const Agents: Agent[] = [
  {
    id: "testament_bot",
    title: "Testament Bot",
    description: "Assist with testament creation",
    workflowType: `${AGENT}:Testament Bot`,
    suggestions: [
      "What is the status?",
      "What can you do?",
      "Help me create a testament"
    ]
  },
  {
    id: "testament_data_flow",
    title: "Testament Data Flow",
    description: "Assist with testament data management",
    workflowType: `${AGENT}:Testament Data Flow`
  }
];

// Step definitions with simplified theme names
export const steps: StepDefinition[] = [
  {
    title: "Personal Information",
    slug: "personal-info",
    theme: "blue",
    botId: "testament_bot",
    componentLoader: () => import('./components/PersonalInformation').then(m => m.default)
  },
  {
    title: "Assets",
    slug: "assets",
    theme: "blue",
    botId: "testament_bot",
    componentLoader: () => import('./components/Assets').then(m => m.default)
  },
  {
    title: "Beneficiaries",
    slug: "beneficiaries",
    theme: "blue",
    botId: "testament_bot",
    componentLoader: () => import('./components/Beneficiaries').then(m => m.default)
  },
  {
    title: "Executors",
    slug: "executors",
    theme: "blue",
    botId: "testament_bot",
    componentLoader: () => import('./components/Executors').then(m => m.default)
  },
  {
    title: "Guardians",
    slug: "guardians",
    theme: "blue",
    botId: "testament_bot",
    componentLoader: () => import('./components/Guardians').then(m => m.default)
  },
  {
    title: "Special Instructions",
    slug: "special-instructions",
    theme: "blue",
    botId: "testament_bot",
    componentLoader: () => import('./components/SpecialInstructions').then(m => m.default)
  },
  {
    title: "Review & Submit",
    slug: "review",
    theme: "blue",
    componentLoader: () => import('./components/ReviewSubmit').then(m => m.default)
  }
];

export default steps; 