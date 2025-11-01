# Remote MCP Development Guide

Remote MCP is a cloud platform for creating and managing Model Context Protocol (MCP) servers that connect AI clients to external services (GitHub, Slack, PostgreSQL, etc.). This platform enables AI assistants to securely interact with external tools through a standardized protocol.

## Architecture Overview

### Core Stack
- **Frontend/Backend**: TanStack Start (SSR React) + Vite
- **Database**: PostgreSQL with Drizzle ORM (`src/db/schema.ts`)
- **Auth**: Better Auth (`src/lib/auth.ts`) with email/password + OAuth (Google, GitHub)
- **API Layer**: Two parallel patterns:
  - tRPC for client-server queries (`src/integrations/trpc/`)
  - TanStack Router server functions for route-specific logic (`src/services/`)
- **Encryption**: AES-256-CBC for sensitive credentials (`src/lib/encryption.ts`)
- **MCP Integration**: `@socotra/modelcontextprotocol-sdk` for server implementation
- **Error Tracking**: Sentry (configured in `vite.config.ts`)
- **i18n**: i18next with locales in `public/locales/` (en, es, fr, de)

### Critical Data Flow
1. Users authenticate via Better Auth → sessions stored in `sessions` table
2. Users create MCP servers → stored in `mcp_server` table with OAuth 2.1 client credentials
3. Users connect apps (GitHub, Slack, etc.) → credentials encrypted in `app_connection` table
4. MCP servers exposed at `/api/mcp/$id` (see `src/routes/api/mcp.$id.tsx`)
5. AI clients authenticate using OAuth 2.1 (`src/lib/oauth2.ts`)
6. Tool invocations logged to `mcp_run` table for auditing

### MCP Server Endpoint Flow
- Route: `/api/mcp/$id` handles SSE transport for MCP protocol
- Auth: OAuth 2.1 bearer tokens OR internal API key (`X-API-Key` header)
- Session caching: Validated tokens cached in `sessionCache` Map to reduce DB lookups
- Tool execution: Proxied through app-specific handlers in `src/app/mcp/apps/{app}/tools/`

## Routing & Server Functions

**TanStack Router** with file-based routing:
- `src/routes/_authed/` → Protected routes (require authentication)
- `src/routes/api/` → API endpoints using `createServerFileRoute().methods({})`
- Route params: Use `$` prefix (e.g., `$id.tsx` for `/servers/:id`)
- Auto-generated: `src/routeTree.gen.ts` (ignored by Biome, don't edit manually)

**Creating new routes**:
1. Create empty `.tsx` file in `src/routes/`
2. Dev server auto-generates boilerplate on hot reload
3. Use `createFileRoute()` for client routes, `createServerFileRoute()` for API endpoints

**Server Functions** (`src/services/`) pattern:
```typescript
export const myFunction = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .middleware([userRequiredMiddleware])
  .handler(async ({ data, context }) => {
    // context.userSession available via middleware
    return { /* data */ };
  });
```

**Auth Middleware**:
- `userMiddleware`: Adds `userSession` to context (nullable)
- `userRequiredMiddleware`: Throws 401 if not authenticated
- Import from `src/services/auth.api.ts`

## tRPC API Layer

**Location**: `src/integrations/trpc/router/` → exported in `router/index.ts`

**Pattern**:
```typescript
import { createTRPCRouter, protectedProcedure } from "../init";

export const myRouter = createTRPCRouter({
  myQuery: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // ctx.user and ctx.session available
      // Better Auth session validated in protectedProcedure
    }),
});
```

**Two Auth Patterns (use appropriately)**:
- **tRPC**: Use `protectedProcedure` for client-side data fetching
- **Server Functions**: Use `userRequiredMiddleware` for route-specific logic

**Existing routers**: `mcpServer`, `mcpApp`, `appConnection`, `mcpRun`, `user`, `userSettings`, `chat`, `llmProvider`

**Chat router specifics**:
- Messages stored with JSONB `content` array (supports tool calls, reasoning, images)
- Use `generateId()` from `ai` package for chat/message IDs
- Token usage tracked in `tokenUsage` field (`promptTokens`, `completionTokens`, `totalTokens`)

## MCP App Integration (Plugin System)

**Structure**: Each app in `src/app/mcp/apps/{app-name}/`
- `index.ts`: App definition using `createMcpApp()`
- `common.ts`: Auth config and shared utilities
- `tools/`: Tool definitions using `createParameterizedTool()`

**Available Apps** (13 integrations, 159+ tools):
- Developer: `github`, `gitlab`, `atlassian` (Jira/Confluence)
- Communication: `slack`, `notion`
- Media: `youtube`, `spotify`, `google-drive`
- Data: `postgres`, `brave`, `fetch`, `firecrawl`
- Productivity: `linear`

**Adding New MCP App**:
```typescript
// src/app/mcp/apps/myapp/index.ts
import { createMcpApp } from "../../mcp-app";
import { McpAppCategory } from "../../mcp-app/app-metadata";
import { oauthProperty } from "../../mcp-app/property";

export const myApp = createMcpApp({
  name: "myapp",                    // Unique identifier (lowercase, hyphenated)
  displayName: "My App",            // User-facing name
  description: "Integration description",
  logo: { type: "icon", icon: "myapp" },
  categories: [McpAppCategory.DEVELOPER_TOOLS],
  auth: oauthProperty({             // OAuth2 configuration
    authorizationUrl: "https://...",
    tokenUrl: "https://...",
    clientId: "YOUR_CLIENT_ID",
    scopes: ["read", "write"],
  }),
  tools: [/* import from tools/ */],
});
```

**Register app** in `src/app/mcp/apps/index.ts` → add to `mcpApps` array

**Tool Definition Pattern** (`tools/my-tool.ts`):
```typescript
import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod/v4";

export const myTool = createParameterizedTool({
  name: "myToolName",
  auth: myAppAuth,                  // Reference auth from common.ts
  description: "What this tool does",
  paramsSchema: {
    param1: z.string().describe("Parameter description"),
  },
  callback: async (args, extra) => {
    // extra.auth contains decrypted OAuth tokens
    // extra.loggingContext for audit trail
    // Return { content: [{ type: "text", text: "..." }] }
  },
});
```

**Credential Encryption**:
- All OAuth tokens/API keys encrypted using `encryptObject()` from `src/lib/encryption.ts`
- Decrypted on-the-fly during tool execution
- Never log decrypted credentials
- Storage: `app_connection` table → `connectionValue` JSONB column

## Database Schema

**Drizzle ORM** commands:
```bash
pnpm db:generate  # Generate migration from schema changes
pnpm db:migrate   # Apply pending migrations
pnpm db:studio    # Open Drizzle Studio (GUI)
```

**Key Tables** (`src/db/schema.ts`):
- `users`: Better Auth user accounts
- `sessions`: Active user sessions with expiry
- `accounts`: OAuth provider accounts (Google, GitHub)
- `mcp_server`: User-created MCP servers with OAuth client credentials
- `app_connection`: Encrypted credentials per user per app (`connectionValue` JSONB)
- `mcp_run`: Audit log of tool executions with args/results
- `oauth_clients`, `oauth_access_tokens`, `oauth_authorization_codes`: OAuth 2.1 implementation

**Schema Patterns**:
- All tables use text IDs (generated via `generateId()` from `src/lib/id.ts`)
- Timestamps: `createdAt`, `updatedAt` with `withTimezone: true`
- Foreign keys: Cascade deletes where appropriate
- Encrypted data: Use JSONB columns + `encryptObject()` helper

## UI Development

**Component Library**: shadcn/ui
```bash
pnpx shadcn@latest add <component>  # Install new component
```

**Key UI Components** (`src/components/`):
- `app-sidebar.tsx`: Main navigation (uses `nav-main.tsx`, `nav-user.tsx`)
- `model-selector.tsx`: LLM provider selection for chat
- `assistant-ui/`: Chat interface components (uses `@assistant-ui/react`)
- `data-table/`: Reusable table with sorting/filtering (TanStack Table)

**Styling**:
- Tailwind CSS 4 (configured via `@tailwindcss/vite` plugin)
- Tab-based indentation (Biome enforced)
- Motion: Framer Motion for animations

## Code Quality & Pre-Commit

**Biome** (replaces ESLint/Prettier):
```bash
pnpm check        # Lint + format check
pnpm format       # Auto-fix formatting
pnpm lint         # Lint only
```

**Pre-commit workflow** (enforced via `husky` + `lint-staged`):
```bash
pnpm tsc --noEmit  # Type check (fails on TS errors)
pnpm check         # Biome lint/format
pnpm build         # Verify production build
```

**Biome Config** (`biome.json`):
- Tab indentation enforced
- Ignores: `src/routeTree.gen.ts` (auto-generated)
- Disabled rules: `noArrayIndexKey`, `useKeyWithClickEvents`, `useSemanticElements`

## Environment Variables

**Configuration** (`src/env.ts` using `@t3-oss/env-core`):
- Server-only vars validated at runtime
- Client vars must be prefixed with `VITE_`

**Required**:
- `DATABASE_URL`: PostgreSQL connection string
- `ENCRYPTION_KEY`: 32-byte key for AES-256-CBC (generate with `openssl rand -hex 32`)
- `BETTER_AUTH_SECRET`: Random secret for Better Auth
- `MCP_SERVER_API_KEY`: Internal API key for server-to-server MCP calls

**Optional** (for OAuth providers):
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `OAUTH_APP_SECRETS`: JSON string with secrets for MCP apps

**Sentry** (error tracking):
- `VITE_SENTRY_DSN`, `VITE_SENTRY_ORG`, `VITE_SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

## Testing & Debugging

**Development**:
```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build
pnpm serve        # Preview production build
pnpm test         # Run Vitest tests
```

**Common Patterns**:
- Use `getWebRequest()` from `@tanstack/react-start/server` to access raw request
- OAuth debugging: Check `sessionCache` in `src/routes/api/mcp.$id.tsx`
- Tool execution logging: Query `mcp_run` table for recent invocations
- Encryption issues: Verify `ENCRYPTION_KEY` is exactly 32 bytes

## AI/LLM Integration (Vercel AI SDK)

**Multi-Provider Support**: Platform supports 7+ LLM providers via unified interface
- **Provider abstraction**: `src/lib/chat-adapters.ts` handles attachments (images, text)
- **Dynamic models**: `src/lib/models-dev.ts` fetches model data from models.dev API (24h cache)
- **Provider enum**: `src/types/models.ts` defines `LLMProvider` with schema validation
- **Free tier providers**: `src/components/free-tier-providers.tsx` highlights no-cost options

**Chat Architecture** (`@assistant-ui/react` + `ai` package):
```typescript
// Service layer handles persistence
import { saveChat } from "@/services/chat-service";
import { uiMessageToDbMessage } from "@/lib/chat-utils";

// tRPC router for chat operations
chatRouter.createMessage({ chatId, role, content, status, tokenUsage });
```

**Key patterns**:
- Use `generateId()` from `ai` package for chat/message IDs (consistent with AI SDK)
- Store messages as JSONB with `MessagePart[]` content (supports tool calls, reasoning, attachments)
- Session-based caching for models data (`sessionStorage`, 24h TTL)
- Vision support: Images converted to base64 data URLs in `VisionImageAdapter`

## Client-Side Component Pattern

**SSR with React Start**: Components are server-side by default
- Add `"use client"` directive ONLY for:
  - Interactive UI with React hooks (`useState`, `useEffect`, etc.)
  - Third-party client-only libraries (e.g., `@assistant-ui/react`)
  - Browser APIs (localStorage, window, etc.)
- Examples: All files in `src/components/data-table/`, `src/components/ui/`
- **Do NOT add** to route files or server function files

## Key Conventions

1. **Zod Schemas**: Use `zod/v4` (not default import) for all validation
2. **IDs**: Generate with `generateId()` from `src/lib/id.ts` (nanoid) OR `ai` package (chat/messages)
3. **Error Handling**: Return `{ content: [...], isError: true }` from tool callbacks
4. **Async/Await**: Always use async/await (no promise chaining)
5. **Type Safety**: Import types from `@/types/` (path alias configured)
6. **File Organization**: Co-locate related files (e.g., `tools/` within `apps/github/`)
7. **Path Aliases**: Use `@/` prefix for all internal imports (configured via `vite-tsconfig-paths`)
