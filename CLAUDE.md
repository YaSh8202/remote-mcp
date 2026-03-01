# CLAUDE.md

## Quick Start

**Development commands:**
```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build (includes type checking)
pnpm test         # Run Vitest tests
pnpm check        # Run Biome linter + formatter
pnpm format       # Auto-fix formatting issues
```


## Architecture

Remote MCP is a cloud platform for creating Model Context Protocol (MCP) servers that connect AI clients to external services (GitHub, Slack, PostgreSQL, etc.).

### Tech Stack
- **Framework:** TanStack Start (SSR React + Vite)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth with OAuth (Google, GitHub)
- **API:** Dual layer - tRPC + TanStack Router server functions
- **MCP:** `@modelcontextprotocol/sdk` for protocol implementation
- **AI SDK:** Vercel AI SDK v6.0.1 with `ToolLoopAgent` pattern
- **UI:** Custom AI Elements component library + shadcn/ui + Tailwind CSS 4
- **Testing:** Vitest + Testing Library



## Routing Patterns

**File-based routing** with TanStack Router:
- `src/routes/_authed/` → Protected routes (auth required)
- `src/routes/api/` → API endpoints
- `src/routes/[.]well-known/` → OAuth/MCP discovery endpoints
- `src/routes/api/chat/-libs/` → Route-local utilities (note `-libs` prefix)

**Route params:** Use `$` prefix (e.g., `$id.tsx` → `/servers/:id`)

**Creating routes:**
1. Create empty `.tsx` file in `src/routes/`
2. Dev server auto-generates boilerplate
3. Use `createFileRoute()` for client routes, `createServerFileRoute()` for APIs

**Auto-generated:** `src/routeTree.gen.ts` (never edit manually)

## API Layer Patterns

### Server Functions (`src/services/`)
Use for route-specific logic. See existing files in `src/services/` for patterns.

**Auth middleware:**
- `userMiddleware` → adds nullable `userSession` to context
- `userRequiredMiddleware` → throws 401 if not authenticated

### tRPC (`src/integrations/trpc/router/`)
Use for client-side data fetching. See existing routers for patterns.

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

**Tool pattern:** See any existing tool in `src/app/mcp/apps/*/tools/` for the `createParameterizedTool()` pattern.

**Credential security:** All tokens encrypted via `encryptObject()` from `src/lib/encryption.ts` (AES-256-CBC), stored in `app_connection.connectionValue` (JSONB).

## Database (Drizzle ORM)

**Schema location:** `src/db/schema.ts`

**Key tables:**
- `users`, `sessions`, `accounts` → Better Auth
- `chats`, `messages` → Chat storage with JSONB `parts` arrays (AI SDK v6 format)
- `chatMcpServers` → Junction table for per-chat tool filtering
- `mcp_server` → User-created servers with OAuth credentials
- `app_connection` → Encrypted app credentials
- `mcp_run` → Tool execution audit log
- `llmProviderKeys` → User API keys for OpenAI/Anthropic/etc (encrypted)
- `oauth_clients`, `oauth_access_tokens` → OAuth 2.1 implementation

**Patterns:**
- Timestamps: `createdAt`, `updatedAt` with timezone
- Encrypted data: JSONB columns + `encryptObject()` from `src/lib/encryption.ts`

## UI Components

**Key components:**
- `src/components/ai-elements/` → Custom chat UI library
- `src/components/chat/` → App-specific chat components
- `src/components/app-sidebar.tsx` → Main navigation
- `src/components/model-selector.tsx` → LLM provider selection
- `src/components/data-table/` → Reusable tables (TanStack Table)

**Styling:** Tailwind CSS 4 with tab indentation (Biome enforced)

## LLM Integration (Vercel AI SDK v6)


**Chat architecture:**
- Messages stored as JSONB with `MessagePart[]` content
- Supports tool calls, reasoning, images, file attachments
- Use `generateMessageId` from `ai` package for IDs
- Token usage tracked in `tokenUsage` field

**State management (Zustand):**
- `src/store/chat-store.ts` → Model selection (persisted with backward-compatible migration)
- `src/store/new-chat-store.ts` → Pre-chat server selection
- `src/store/header-store.ts` → Breadcrumb state


## Key Conventions

1. **Zod:** Import from `zod/v4` (not default)
2. **IDs:** Use `generateId()` from `src/lib/id.ts` OR `ai` package; for messages use `createIdGenerator({ prefix: "msg" })`
3. **Error handling:** Return `{ content: [...], isError: true }` from tool callbacks

## Testing

**Vitest + Testing Library:** `pnpm test`

## Code Quality

**Biome** (replaces ESLint/Prettier):
- Tab indentation enforced
- Ignores: `src/routeTree.gen.ts`
- Pre-commit: Type check + lint + build

