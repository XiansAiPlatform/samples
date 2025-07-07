import type { StepDefinition, Agent } from '../../../components/types';
import { matchPath } from 'react-router-dom';
import { steps, Agents, POA_BASE_URL, POA_ROUTE_PATTERN } from '../steps';

// Utility functions for working with steps
export const getStepBySlug = (slug: string): StepDefinition | undefined => {
  return steps.find(step => step.slug === slug);
};

export const getStepIndexBySlug = (slug: string): number => {
  return steps.findIndex(step => step.slug === slug);
};

export const getStepUrl = (step: StepDefinition, documentId?: string): string => {
  if (documentId) {
    return `${POA_BASE_URL}/${documentId}/${step.slug}`;
  }
  // Fallback for backward compatibility
  return `${POA_BASE_URL}/new/${step.slug}`;
};

export const getStepUrlBySlug = (slug: string, documentId?: string): string => {
  if (documentId) {
    return `${POA_BASE_URL}/${documentId}/${slug}`;
  }
  // Fallback for backward compatibility
  return `${POA_BASE_URL}/new/${slug}`;
};

export const getFirstStepUrl = (documentId?: string): string => {
  return steps.length > 0 ? getStepUrl(steps[0], documentId) : POA_BASE_URL;
};

export const getAllStepSlugs = (): string[] => {
  return steps.map(step => step.slug);
};

// Utility functions for working with agents
export const getAgentByWorkflowId = (workflowId: string): Agent | undefined => {
  return Agents.find(agent => agent.workflowId === workflowId);
};

export const getAgentById = (id: string): Agent | undefined => {
  return Agents.find(agent => agent.id === id);
};

export const getAgentForStep = (step: StepDefinition): Agent | undefined => {
  return step.botId ? getAgentById(step.botId) : undefined;
};

/**
 * Find step index by bot ID
 * Used for navigation when clicking action buttons in FindingsPane
 */
export const getStepIndexByBotId = (botId: string): number | null => {
  console.log(`[POA Steps] 🔍 Finding step index for botId: ${botId}`);
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.botId === botId) {
      console.log(`[POA Steps] ✅ Found step ${i} (${step.title}) for botId: ${botId}`);
      return i;
    }
  }
  
  console.warn(`[POA Steps] ❌ No step found for botId: ${botId}`);
  console.log(`[POA Steps] 📊 Available steps with botIds:`, steps.map((step, index) => ({
    index,
    title: step.title,
    botId: step.botId
  })));
  return null;
};

/**
 * Map handoff message to target step index using WorkflowId or text parsing
 * This function contains the step-specific logic for handoff routing
 */
export const getStepIndexFromHandoffMessage = (message: { text: string; data?: any; workflowId?: string }): number | null => {
  console.log(`[POA Steps] 🔍 Starting step mapping for handoff message:`);
  console.log(`[POA Steps] 📝 Message text:`, message.text);
  console.log(`[POA Steps] 🎯 Target workflowId:`, message.workflowId);
  
  // First try: Use the WorkflowId from the handoff message to determine target step
  if (message.workflowId) {
    console.log(`[POA Steps] 🔄 Searching through ${steps.length} steps for matching agent...`);
    
    // Find the step that uses this WorkflowId
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`[POA Steps] 📋 Step ${i} (${step.title}): botId=${step.botId}`);
      
      if (step.botId) {
        const agent = getAgentById(step.botId);
        console.log(`[POA Steps] 🤖 Found agent for step ${i}:`, {
          agentId: agent?.id,
          agentWorkflowId: agent?.workflowId,
          targetWorkflowId: message.workflowId,
          matches: agent?.workflowId === message.workflowId
        });
        
        if (agent && agent.workflowId === message.workflowId) {
          console.log(`[POA Steps] ✅ MATCH! Handoff to WorkflowId: ${message.workflowId}, target step: ${i} (${step.title})`);
          return i;
        }
      } else {
        console.log(`[POA Steps] ⚪ Step ${i} has no botId, skipping`);
      }
    }
    
    console.log(`[POA Steps] ❌ No matching step found for workflowId: ${message.workflowId}`);
    console.log(`[POA Steps] 📊 Available agents:`, Agents.map(agent => ({
      id: agent.id,
      workflowId: agent.workflowId,
      title: agent.title
    })));
  } else {
    console.log(`[POA Steps] ⚠️ No workflowId provided, trying text parsing...`);
  }
  
  // Second try: Parse the message text for handoff direction
  // Expected format: "Source Bot -> Target Bot"
  const handoffMatch = message.text.match(/(.+?)\s*->\s*(.+)/);
  if (handoffMatch) {
    const targetBotName = handoffMatch[2].trim();
    console.log(`[POA Steps] 🎯 Extracted target bot from text: "${targetBotName}"`);
    
    // Find the step that uses an agent with this bot name in the workflowId
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.botId) {
        const agent = getAgentById(step.botId);
        if (agent && agent.workflowId && agent.workflowId.includes(targetBotName)) {
          console.log(`[POA Steps] ✅ TEXT MATCH! Target bot "${targetBotName}" maps to step ${i} (${step.title})`);
          return i;
        }
      }
    }
    
    console.log(`[POA Steps] ❌ No step found for target bot: "${targetBotName}"`);
  } else {
    console.log(`[POA Steps] ❌ Could not parse handoff direction from text: "${message.text}"`);
  }
  
  console.warn(`[POA Steps] Could not determine target step from handoff message WorkflowId: ${message.workflowId}`);
  return null;
};

// Function to initialize websocket connections for all agents
export const initializeAgentWebsockets = () => {
  return Agents.map(agent => {
    // Return agent info for websocket initialization
    return {
      workflowId: agent.workflowId,
      title: agent.title,
      agent: agent.agent,
      workflowType: agent.workflowType
    };
  });
};

// Function to generate default metadata for POA workflow
export const generateDefaultMetadata = () => {
  // Use React Router's matchPath to extract documentId from current URL
  const match = matchPath(
    POA_ROUTE_PATTERN,
    window.location.pathname
  );
  
  if (match?.params?.documentId && match.params.documentId !== 'new') {
    return {
      documentId: match.params.documentId,
      requestId: Date.now().toString() //generate unique id for the request
    };
  }
  
  return {};
}; 