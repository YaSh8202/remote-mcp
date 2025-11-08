# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Development commands:**
```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build (includes type checking)
pnpm test         # Run Vitest tests
pnpm check        # Run Biome linter + formatter
pnpm format       # Auto-fix formatting issues
```

**Database commands:**
```bash
pnpm db:generate  # Generate migration from schema changes
pnpm db:migrate   # Apply pending migrations
pnpm db:studio    # Open Drizzle Studio (GUI)
```

**Pre-commit:** Husky + lint-staged runs `tsc --noEmit`, `biome check`, and `build` before commits.

## Architecture

Remote MCP is a cloud platform for creating Model Context Protocol (MCP) servers that connect AI clients to external services (GitHub, Slack, PostgreSQL, etc.).

### Tech Stack
- **Framework:** TanStack Start (SSR React + Vite)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth with OAuth (Google, GitHub)
- **API:** Dual layer - tRPC + TanStack Router server functions
- **MCP:** `@socotra/modelcontextprotocol-sdk` for protocol implementation
- **UI:** shadcn/ui + Tailwind CSS 4
- **Testing:** Vitest + Testing Library

### Critical Data Flow
1. Users authenticate → sessions in `sessions` table
2. Create MCP servers → `mcp_server` table with OAuth 2.1 credentials
3. Connect apps → encrypted credentials in `app_connection` table
4. AI clients connect to `/api/mcp/$id` endpoint
5. Tool invocations logged to `mcp_run` table

### MCP Server Endpoint (`/api/mcp/$id`)
- **Transport:** Server-Sent Events (SSE)
- **Auth:** OAuth 2.1 bearer tokens OR internal API key (`X-API-Key`)
- **Session caching:** Validated tokens cached in `sessionCache` Map
- **Tool execution:** Proxied through `src/app/mcp/apps/{app}/tools/`

## Routing Patterns

**File-based routing** with TanStack Router:
- `src/routes/_authed/` → Protected routes (auth required)
- `src/routes/api/` → API endpoints
- `src/routes/[.]well-known/` → OAuth/MCP discovery endpoints

**Route params:** Use `$` prefix (e.g., `$id.tsx` → `/servers/:id`)

**Creating routes:**
1. Create empty `.tsx` file in `src/routes/`
2. Dev server auto-generates boilerplate
3. Use `createFileRoute()` for client routes, `createServerFileRoute()` for APIs

**Auto-generated:** `src/routeTree.gen.ts` (never edit manually)

## API Layer Patterns

### Server Functions (`src/services/`)
Use for route-specific logic:
```typescript
export const myFunction = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .middleware([userRequiredMiddleware])
  .handler(async ({ data, context }) => {
    // context.userSession available
  });
```

**Auth middleware:**
- `userMiddleware` → adds nullable `userSession` to context
- `userRequiredMiddleware` → throws 401 if not authenticated

### tRPC (`src/integrations/trpc/router/`)
Use for client-side data fetching:
```typescript
export const myRouter = createTRPCRouter({
  myQuery: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // ctx.user and ctx.session available
    }),
});
```

**Existing routers:** `mcpServer`, `mcpApp`, `appConnection`, `mcpRun`, `user`, `userSettings`, `chat`, `llmProvider`

## MCP App Integration (Plugin System)

Apps live in `src/app/mcp/apps/{app-name}/`:
- `index.ts` → App definition via `createMcpApp()`
- `common.ts` → Auth config + shared utilities
- `tools/` → Tool definitions via `createParameterizedTool()`

**13 integrated apps (159+ tools):**
- Developer: `github`, `gitlab`, `atlassian`
- Communication: `slack`, `notion`, `linear`
- Media: `youtube`, `spotify`, `google-drive`
- Data: `postgres`, `brave`, `fetch`, `firecrawl`

**Adding new app:**
1. Create `src/app/mcp/apps/myapp/index.ts` with `createMcpApp()`
2. Define tools in `tools/` subdirectory
3. Register in `src/app/mcp/apps/index.ts` → add to `mcpApps` array

**Tool pattern:**
```typescript
export const myTool = createParameterizedTool({
  name: "myToolName",
  auth: myAppAuth,
  description: "What this tool does",
  paramsSchema: {
    param1: z.string().describe("Param description"),
  },
  callback: async (args, extra) => {
    // extra.auth → decrypted OAuth tokens
    // extra.loggingContext → for audit trail
    return { content: [{ type: "text", text: "..." }] };
  },
});
```

**Credential security:**
- All tokens encrypted via `encryptObject()` from `src/lib/encryption.ts`
- Stored in `app_connection.connectionValue` (JSONB)
- Never log decrypted credentials

## Database (Drizzle ORM)

**Schema location:** `src/db/schema.ts`

**Key tables:**
- `users`, `sessions`, `accounts` → Better Auth
- `mcp_server` → User-created servers with OAuth credentials
- `app_connection` → Encrypted app credentials
- `mcp_run` → Tool execution audit log
- `oauth_clients`, `oauth_access_tokens` → OAuth 2.1 implementation

**Patterns:**
- Text IDs via `generateId()` from `src/lib/id.ts` OR `ai` package
- Timestamps: `createdAt`, `updatedAt` with timezone
- Encrypted data: JSONB columns + `encryptObject()`

## UI Components

**shadcn/ui** components:
```bash
pnpx shadcn@latest add <component>
```

**Key components:**
- `src/components/app-sidebar.tsx` → Main navigation
- `src/components/model-selector.tsx` → LLM provider selection
- `src/components/assistant-ui/` → Chat interface (`@assistant-ui/react`)
- `src/components/data-table/` → Reusable tables (TanStack Table)

**Styling:** Tailwind CSS 4 with tab indentation (Biome enforced)

## LLM Integration (Vercel AI SDK)

**Multi-provider support:** 7+ providers via unified interface
- `src/lib/chat-adapters.ts` → Handles attachments (images, text)
- `src/lib/models-dev.ts` → Fetches model data from models.dev API (24h cache)
- `src/types/models.ts` → `LLMProvider` enum with validation

**Chat architecture:**
- Messages stored as JSONB with `MessagePart[]` content
- Supports tool calls, reasoning, images
- Use `generateId()` from `ai` package for IDs
- Token usage tracked in `tokenUsage` field

## Key Conventions

1. **Zod:** Import from `zod/v4` (not default)
2. **IDs:** Use `generateId()` from `src/lib/id.ts` OR `ai` package
3. **Client components:** Add `"use client"` only for interactive UI/hooks
4. **Path aliases:** Use `@/` prefix for all internal imports
5. **Error handling:** Return `{ content: [...], isError: true }` from tool callbacks
6. **Async/await:** Always use async/await (no promise chaining)

## Environment Variables

**Required (`src/env.ts`):**
- `DATABASE_URL` → PostgreSQL connection
- `ENCRYPTION_KEY` → 32-byte key (`openssl rand -hex 32`)
- `BETTER_AUTH_SECRET` → Random secret
- `MCP_SERVER_API_KEY` → Internal API key

**Optional:**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `OAUTH_APP_SECRETS` → JSON with MCP app secrets
- Sentry: `VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

## Code Quality

**Biome** (replaces ESLint/Prettier):
- Tab indentation enforced
- Ignores: `src/routeTree.gen.ts`
- Pre-commit: Type check + lint + build

**Important:** Never manually edit `src/routeTree.gen.ts` - it's auto-generated.
