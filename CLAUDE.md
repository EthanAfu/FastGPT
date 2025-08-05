# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastGPT is an AI Agent construction platform providing out-of-the-box data processing, model invocation capabilities, and visual workflow orchestration through Flow. This is a full-stack TypeScript application built on NextJS with MongoDB/PostgreSQL backends.

**Tech Stack**: NextJS + TypeScript + ChakraUI + MongoDB + PostgreSQL (PG Vector)/Milvus

## Architecture

This is a monorepo using pnpm workspaces with the following key structure:

### Packages (Library Code)
- `packages/global/` - Shared types, constants, utilities used across all projects
- `packages/service/` - Backend services, database schemas, API controllers, workflow engine
- `packages/web/` - Shared frontend components, hooks, styles, i18n
- `packages/templates/` - Application templates for the template market

### Projects (Applications)
- `projects/app/` - Main NextJS web application (frontend + API routes)
- `projects/sandbox/` - NestJS code execution sandbox service
- `projects/mcp_server/` - Model Context Protocol server implementation

### Key Directories
- `document/` - Documentation site (NextJS app with content)
- `plugins/` - External plugins (models, crawlers, etc.)
- `deploy/` - Docker and Helm deployment configurations
- `test/` - Centralized test files and utilities

## Development Commands

### Main Commands (run from project root)
- `pnpm dev` - Start development for all projects (uses package.json workspace scripts)
- `pnpm build` - Build all projects  
- `pnpm test` - Run tests using Vitest
- `pnpm test:workflow` - Run workflow-specific tests
- `pnpm lint` - Run ESLint across all TypeScript files with auto-fix
- `pnpm format-code` - Format code using Prettier

### Project-Specific Commands
**Main App (projects/app/)**:
- `cd projects/app && pnpm dev` - Start NextJS dev server
- `cd projects/app && pnpm build` - Build NextJS app
- `cd projects/app && pnpm start` - Start production server
- `cd projects/app && pnpm lint` - Lint app-specific code
- `cd projects/app && npx tsc --noEmit` - Type check without compilation

**Sandbox (projects/sandbox/)**:
- `cd projects/sandbox && pnpm dev` - Start NestJS dev server with watch mode
- `cd projects/sandbox && pnpm build` - Build NestJS app
- `cd projects/sandbox && pnpm test` - Run Jest tests

**MCP Server (projects/mcp_server/)**:
- `cd projects/mcp_server && bun dev` - Start with Bun in watch mode
- `cd projects/mcp_server && bun build` - Build MCP server
- `cd projects/mcp_server && bun start` - Start MCP server

### Utility Commands
- `pnpm create:i18n` - Generate i18n translation files
- `pnpm api:gen` - Generate OpenAPI documentation
- `pnpm initIcon` - Initialize icon assets
- `pnpm gen:theme-typings` - Generate Chakra UI theme typings

## Testing

The project uses Vitest for testing with coverage reporting. Key test commands:
- `pnpm test` - Run all tests
- `pnpm test:workflow` - Run workflow tests specifically  
- Test files are located in `test/` directory and `projects/app/test/`
- Coverage reports are generated in `coverage/` directory

## Code Organization Patterns

### Monorepo Structure
- Shared code lives in `packages/` and is imported using workspace references
- Each project in `projects/` is a standalone application
- Use `@fastgpt/global`, `@fastgpt/service`, `@fastgpt/web` imports for shared packages

### API Structure
- NextJS API routes in `projects/app/src/pages/api/`
- Core business logic in `packages/service/core/`
- Database schemas in `packages/service/` with MongoDB/Mongoose
- All API routes use `NextAPI()` wrapper for consistent error handling and middleware
- Authentication pattern: `const { teamId, tmbId } = await authUserPer({ req, authToken: true });`

### Frontend Architecture
- React components in `projects/app/src/components/` and `packages/web/components/`
- Chakra UI for styling with custom theme in `packages/web/styles/theme.ts`
- i18n support with files in `packages/web/i18n/`
- State management using React Context and Zustand
- Custom hooks in `packages/web/hooks/` for reusable business logic
- API communication through typed request functions in `web/*/api.ts` files

### Workflow System Architecture
The visual workflow system is FastGPT's core feature with sophisticated architecture:

**Node System**:
- Node templates defined in `packages/global/core/workflow/template/`
- Each node type implements `FlowNodeTemplateType` interface with inputs, outputs, and execution config
- 48+ different node types registered in `FlowNodeTypeEnum`
- Dynamic input/output system with type coercion via `valueTypeFormat()`

**Execution Engine**:
- Dispatch system in `packages/service/core/workflow/dispatch/` with callback map for each node type
- Edge-based flow control with states: `waiting`, `active`, `skipped`
- Recursive execution with cycle detection and error handling
- Streaming support for real-time workflow execution updates

**Frontend Integration**:
- ReactFlow-based visual editor in `projects/app/src/pageComponents/app/detail/WorkflowComponents/`
- Context system for workflow state management: Init, NodeEdge, Event, Status contexts
- Dynamic node rendering with lazy loading based on node type

## Service Layer Architecture

### Database Abstraction
- **MongoDB**: Primary database with dual connections (main + logs) using singleton pattern
- **Vector Databases**: Multi-provider support (PostgreSQL/pgvector, OceanBase, Milvus) with fallback pattern
- **Redis**: Queue system with memory fallback when Redis unavailable
- All database connections use global caching and graceful degradation

### Queue System
- BullMQ + Redis for background processing with queue types: `datasetSync`, `evaluation`
- Custom `MemoryRedis` class provides fallback when Redis unavailable
- Jobs auto-deleted on completion/failure for memory efficiency

### AI Provider Integration
- Unified model management with global model maps for LLM, embedding, TTS, STT, rerank
- Plugin-based extensibility for external models
- Configuration hierarchy: User keys > System config > Environment variables
- OpenAI API compatibility layer supporting multiple providers

### Permission System
- RBAC with team-based permissions and resource-level access control
- Authentication methods: JWT tokens, API keys, root access
- Session management in Redis with configurable limits
- Permission inheritance: Personal > Group > Organization

## Development Notes

- **Package Manager**: Uses pnpm with workspace configuration
- **Node Version**: Requires Node.js >=18.16.0, pnpm >=9.0.0
- **Database**: Supports MongoDB, PostgreSQL with pgvector, or Milvus for vector storage
- **AI Integration**: Supports multiple AI providers through unified interface
- **Internationalization**: Full i18n support for Chinese, English, and Japanese

## Key File Patterns

- `.ts` and `.tsx` files use TypeScript throughout
- Database schemas use Mongoose with TypeScript
- API routes follow NextJS conventions with `NextAPI()` wrapper
- Component files use React functional components with hooks
- Shared types defined in `packages/global/` with `.d.ts` files

## Environment Configuration

- Configuration files in `projects/app/data/config.json` 
- Environment-specific configs supported
- Model configurations in `packages/service/core/ai/config/`

## Frontend Development Patterns

### Component Architecture
- Compound component pattern for complex UI (e.g., ChatBox components)
- Shared components in `packages/web/components/common/` with consistent prop patterns
- Responsive design with mobile-first approach using Chakra UI

### State Management
- **Zustand**: Global state with persistence (e.g., `useSystemStore`)
- **React Context**: Component tree state with `use-context-selector` for performance
- **React Hook Form**: Form state management with validation

### API Communication
- Typed API functions in dedicated `api.ts` files
- Request utilities with automatic error handling and toast notifications
- SSE support for real-time features (chat streaming, workflow execution)

### Custom Hooks
- `useRequest` family for API calls with loading states and error handling
- System hooks: `useSystem()`, `useToast()`, `useTranslation()`
- Business logic hooks: `useSelectFile()`, `useConfirm()`, `useLoading()`

## Common Development Workflows

### Adding New API Endpoints
1. Create route in `projects/app/src/pages/api/[category]/[operation].ts`
2. Wrap handler with `NextAPI()` and add authentication
3. Define TypeScript interfaces for request/response
4. Create corresponding API function in `web/*/api.ts`

### Adding New Workflow Nodes
1. Define node template in `packages/global/core/workflow/template/`
2. Add node type to `FlowNodeTypeEnum`
3. Implement dispatch handler in `packages/service/core/workflow/dispatch/`
4. Create frontend component in workflow components directory

### Adding New Components
1. Create in appropriate `components/` directory
2. Follow compound component pattern for complex UI
3. Use Chakra UI for styling with responsive design
4. Add to shared components if reusable across projects

## Error Handling Patterns

- All external dependencies have fallback mechanisms (Redis → Memory, Vector DB → None)
- Consistent error response format across API routes
- Global error boundaries in frontend with toast notifications
- Retry mechanisms for external service calls