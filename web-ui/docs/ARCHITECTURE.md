# AI Studio - Architecture Documentation

## Overview
AI Studio is a React-based web application that enables users to discover and engage with AI agents within the organization. The architecture emphasizes simplicity, maintainability, and ease of adoption.

## Tech Stack

### Core Framework
- **React 18** with TypeScript for type safety and better developer experience
- **Vite** as build tool for fast development and optimized production builds
- **React Router v6** for declarative routing

### UI Framework & Styling
- **Material-UI (MUI v5)** for consistent design system and components
- **MUI theming** for light/dark mode and organization branding
- **CSS-in-JS** with MUI's styled components for component-specific styling
- **Responsive design** using MUI's breakpoint system

### State Management
- **React Context + useReducer** for global application state
- **React Query (TanStack Query)** for server state management and caching
- **Local component state** for UI-specific state

## Authentication

### OpenID Connect Integration
- **Generic OIDC provider support** (Keycloak, Auth0, Azure AD, etc.)
- **react-oidc-context** library for standardized OIDC flows
- **JWT token management** with automatic refresh
- **Route protection** with higher-order components

```typescript
// Authentication context structure
interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  token: string | null;
}
```

## API Layer

### Service Architecture
- **Axios-based HTTP client** with interceptors for auth headers
- **API service classes** organized by domain (agents, users, analytics)
- **Request/response interceptors** for error handling and token refresh
- **TypeScript interfaces** for all API contracts

```typescript
// Service layer structure
class AgentService {
  async getAgents(): Promise<Agent[]>
  async getAgent(id: string): Promise<Agent>
  async createChat(agentId: string): Promise<Chat>
}
```

## Component Architecture

### Composition Pattern
- **Atomic design principles** (atoms, molecules, organisms, pages)
- **Compound components** for complex UI patterns
- **Render props** for sharing stateful logic
- **Custom hooks** for reusable business logic

### Directory Structure
```
src/
├── components/           # Reusable UI components
│   ├── atoms/           # Basic building blocks
│   ├── molecules/       # Simple component combinations
│   └── organisms/       # Complex component groups
├── pages/               # Route-level components
├── hooks/               # Custom React hooks
├── services/            # API service layer
├── context/             # React context providers
├── types/               # TypeScript type definitions
└── utils/               # Helper functions
```

## Navigation & Routing

### Route Structure
- **Nested routing** with React Router v6
- **Lazy loading** for code splitting by route
- **Protected routes** with authentication guards
- **Breadcrumb navigation** for deep hierarchies

```typescript
// Main routes structure
/dashboard              # Agent discovery dashboard
/agents/:id            # Individual agent interaction
/agents/:id/chat       # Chat interface with agent
/profile               # User profile and settings
/admin                 # Admin panel (role-based)
```

## Error Handling

### Error Boundaries
- **Global error boundary** for unhandled React errors
- **Route-level error boundaries** for page-specific error recovery
- **API error handling** with user-friendly error messages
- **Retry mechanisms** for failed requests

### Validation
- **Zod** for runtime type validation and form schemas
- **React Hook Form** for form state management and validation
- **Client-side validation** with server-side validation fallback

## Progress Indicators & UX

### Loading States
- **Skeleton loaders** for content placeholders
- **Progress bars** for file uploads and long operations
- **Optimistic updates** for better perceived performance
- **Error states** with retry actions

### Feedback Mechanisms
- **Toast notifications** using MUI Snackbar
- **Loading spinners** for async operations
- **Empty states** with call-to-action guidance

## Mobile Responsiveness

### Responsive Design
- **Mobile-first approach** using MUI breakpoints
- **Touch-friendly interactions** with proper hit targets
- **Progressive Web App (PWA)** capabilities
- **Adaptive layouts** that work across all screen sizes

### Navigation Patterns
- **Bottom navigation** for mobile primary actions
- **Collapsible sidebar** for tablet/desktop navigation
- **Swipe gestures** for mobile chat interactions

## Development Principles

### Code Quality
- **ESLint + Prettier** for consistent code formatting
- **Husky pre-commit hooks** for automated quality checks
- **Component testing** with React Testing Library
- **Type safety** with strict TypeScript configuration

### Performance
- **Code splitting** by routes and heavy components
- **Memoization** for expensive computations
- **Virtual scrolling** for large lists
- **Image optimization** with lazy loading

## Configuration

### Environment Management
- **Environment variables** for API endpoints and auth configuration
- **Feature flags** for gradual feature rollouts
- **Theme configuration** for organization branding
- **Build-time optimization** for production deployments

## Security Considerations

- **Content Security Policy (CSP)** headers
- **Secure token storage** using httpOnly cookies when possible
- **Input sanitization** for user-generated content
- **HTTPS enforcement** in production environments

## Preferred Library Choices

### Core Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.0.0",
  "vite": "^4.4.0"
}
```

### UI & Styling
- **@mui/material** `^5.14.0` - Core Material-UI components
- **@mui/icons-material** `^5.14.0` - Material Design icons
- **@emotion/react** `^11.11.0` - CSS-in-JS (comes with MUI)
- **@emotion/styled** `^11.11.0` - Styled components API

### Routing & Navigation
- **react-router-dom** `^6.15.0` - Declarative routing for React

### State Management & Data Fetching
- **@tanstack/react-query** `^4.32.0` - Server state management and caching
- **axios** `^1.5.0` - HTTP client with interceptors

### Authentication
- **react-oidc-context** `^2.3.0` - OpenID Connect client for React
- **oidc-client-ts** `^2.2.0` - OpenID Connect client library

### Forms & Validation
- **react-hook-form** `^7.45.0` - Performant forms with easy validation
- **zod** `^3.22.0` - TypeScript-first schema validation
- **@hookform/resolvers** `^3.3.0` - Validation resolvers for React Hook Form

### Development & Code Quality
- **@vitejs/plugin-react** `^4.0.0` - Vite React plugin
- **eslint** `^8.45.0` - JavaScript/TypeScript linting
- **prettier** `^3.0.0` - Code formatting
- **husky** `^8.0.0` - Git hooks
- **lint-staged** `^13.2.0` - Run linters on staged files

### Testing
- **vitest** `^0.34.0` - Fast unit test framework (Vite-native)
- **@testing-library/react** `^13.4.0` - Simple and complete testing utilities
- **@testing-library/jest-dom** `^6.1.0` - Custom jest matchers
- **@testing-library/user-event** `^14.4.0` - User interaction simulation

### Utilities
- **date-fns** `^2.30.0` - Modern JavaScript date utility library
- **uuid** `^9.0.0` - UUID generation
- **clsx** `^2.0.0` - Conditional className utility

### Development Tools
- **@types/react** `^18.2.0` - TypeScript definitions for React
- **@types/react-dom** `^18.2.0` - TypeScript definitions for React DOM
- **@types/uuid** `^9.0.0` - TypeScript definitions for UUID

## Why These Choices?

### Proven & Stable
- All libraries have 1M+ weekly downloads on npm
- Backed by major companies or large open-source communities
- Long-term support and regular updates

### Developer Experience
- Excellent TypeScript support out of the box
- Comprehensive documentation and examples
- Large community and ecosystem

### Performance
- Tree-shakable and optimized for modern bundlers
- Minimal runtime overhead
- Built-in optimization features

### Simplicity
- Minimal configuration required
- Intuitive APIs that follow React patterns
- Easy to onboard new team members

---

This architecture prioritizes developer productivity, maintainability, and user experience while avoiding unnecessary complexity. Each technology choice serves a specific purpose and can be easily understood and modified by team members.
