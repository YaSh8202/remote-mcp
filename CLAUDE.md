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
- **MCP:** `@modelcontextprotocol/sdk` for protocol implementation
- **AI SDK:** Vercel AI SDK v6.0.1 with `ToolLoopAgent` pattern
- **UI:** Custom AI Elements component library + shadcn/ui + Tailwind CSS 4
- **Testing:** Vitest + Testing Library

### Critical Data Flow
1. Users authenticate → sessions in `sessions` table
2. Create MCP servers → `mcp_server` table with OAuth 2.1 credentials
3. Connect apps → encrypted credentials in `app_connection` table
4. AI clients connect to `/api/mcp/$id` endpoint
5. Tool invocations logged to `mcp_run` table

### MCP Server Endpoint (`/api/mcp/$id`)
- **Transport:** Server-Sent Events (SSE) via `StreamableHTTPClientTransport`
- **Auth:** OAuth 2.1 bearer tokens OR internal API key (`X-API-Key`)
- **Session caching:** Validated tokens cached in `sessionCache` Map
- **Tool execution:** Proxied through `src/app/mcp/apps/{app}/tools/`

## AI SDK v6 Integration (Critical Pattern)

**Chat route (`src/routes/api/chat/$id.tsx`)** uses AI SDK v6's `ToolLoopAgent`:

```typescript
const codeAgent = new ToolLoopAgent({
	model: aiSdkModel,
	temperature: 0.7,
	tools,
	stopWhen: stepCountIs(25),  // Max 25 tool loop iterations
	providerOptions: getProviderOptions(),
});

return createAgentUIStreamResponse({
	agent: codeAgent,
	uiMessages: allMessages,  // Uses validateUIMessages(), no manual conversion
	sendReasoning: true,       // Enables thinking/reasoning tokens
	onFinish: async ({ messages }) => {
		await saveChat({ chatId, messages, userId });
	},
	generateMessageId,
});
```

**Key features:**
- **UIMessage format:** Messages stored as `parts` arrays (text, file, tool-call, tool-result, reasoning)
- **Tool approval:** Built-in approval workflow for dangerous tools
- **Reasoning support:** Automatic handling of Claude's thinking, OpenAI's reasoning, Google's thoughts
- **Provider options:** Each provider has custom config in `src/routes/api/chat/-libs/models.ts`

**Provider-specific reasoning config:**
```typescript
{
	openai: { reasoningEffort: "medium", textVerbosity: "medium" },
	anthropic: { thinking: { type: "enabled", budgetTokens: 12000 }, sendReasoning: true },
	google: { thinkingConfig: { includeThoughts: true } },
}
```

## MCP Tools Integration Pattern

**File: `src/routes/api/chat/-libs/tools.ts`**

**Dual MCP server support:**
1. **Remote MCP servers:** Internal servers created by users (uses `env.MCP_SERVER_API_KEY` for auth)
2. **External MCP servers:** Direct URL connections with custom headers

**Per-chat tool configuration:**
- `chatMcpServers` table tracks which tools are enabled per chat
- Can enable all tools (`includeAllTools: true`) or cherry-pick specific tools
- Uses `@ai-sdk/mcp` with `StreamableHTTPClientTransport` from `@modelcontextprotocol/sdk`

**Flow:**
```typescript
// For each chat, fetch configured MCP servers
const chatMcpServers = await db.query.chatMcpServers.findMany()

// Connect to each MCP server
const mcpClient = await createMCPClient({ transport: httpTransport })
const serverTools = await mcpClient.tools()

// Filter based on chat config
if (includeAllTools) {
	Object.assign(tools, serverTools)
} else {
	// Only include selected tools
	tools[toolName] = serverTools[toolName]
}
```

## AI Elements Component Library (Custom Chat UI)

**Migration from assistant-ui:**
- Replaced `@assistant-ui/react` with custom components in `src/components/ai-elements/`
- 30+ components using composition pattern with context-based state sharing
- Uses `use-stick-to-bottom` for auto-scroll behavior

**Key components:**
- **Conversation:** `Conversation`, `ConversationContent`, `ConversationScrollButton`
- **Message:** `Message`, `MessageContent`, `MessageResponse`, `MessageAttachment`, `MessageBranch`
- **Prompt:** `PromptInput` with file attachments and drag-and-drop
- **Tool UI:** `Tool`, `ToolHeader`, `ToolContent`, `ToolInput`, `ToolOutput` with approval states
- **Reasoning:** `Reasoning`, `ReasoningContent`, `ReasoningTrigger` - collapsible reasoning display
- **Confirmation:** `Confirmation`, `ConfirmationRequest`, `ConfirmationActions` - tool approval system
- **Sources:** `Sources`, `SourcesTrigger`, `SourcesContent`, `Source` - citation management

**Component pattern:** All components use composition (e.g., `Message.Content`, `Tool.Header`)

**Message renderer (`src/components/chat/message-renderer.tsx`):**
```typescript
message.parts.map((part) => {
	switch (part.type) {
		case "text": return <MessageResponse>{part.text}</MessageResponse>
		case "reasoning": return <Reasoning><ReasoningContent>{part.text}</ReasoningContent></Reasoning>
		case "tool-${toolName}": // Dynamic tool parts
		case "dynamic-tool": return <Tool>...</Tool>
		case "file": return <MessageAttachment data={part} />
		case "source-url": return <Source href={part.url} />
	}
})
```

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
- All tokens encrypted via `encryptObject()` from `src/lib/encryption.ts` (AES-256-CBC)
- Stored in `app_connection.connectionValue` (JSONB)
- Never log decrypted credentials

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
- Text IDs via `generateId()` from `src/lib/id.ts` OR `ai` package
- Messages use `createIdGenerator({ prefix: "msg" })` from `ai` package
- Timestamps: `createdAt`, `updatedAt` with timezone
- Encrypted data: JSONB columns + `encryptObject()`

**Message storage:**
```typescript
// Messages stored with "parts" array (AI SDK v6 format)
content: jsonb("content").$type<MessagePart[]>().notNull()
// Parts can be: text, file, tool-call, tool-result, reasoning, source-url, etc.
```

## UI Components

**shadcn/ui** components:
```bash
pnpx shadcn@latest add <component>
```

**Key components:**
- `src/components/ai-elements/` → Custom chat UI library
- `src/components/chat/` → App-specific chat components
- `src/components/app-sidebar.tsx` → Main navigation
- `src/components/model-selector.tsx` → LLM provider selection
- `src/components/data-table/` → Reusable tables (TanStack Table)

**Styling:** Tailwind CSS 4 with tab indentation (Biome enforced)

## LLM Integration (Vercel AI SDK v6)

**Multi-provider support:** 7+ providers via unified interface
- `src/lib/models-dev.ts` → Fetches model data from models.dev API (24h cache)
- `src/types/models.ts` → `LLMProvider` enum with validation
- `src/routes/api/chat/-libs/models.ts` → Provider-specific reasoning config

**Chat architecture:**
- Messages stored as JSONB with `MessagePart[]` content
- Supports tool calls, reasoning, images, file attachments
- Use `generateMessageId` from `ai` package for IDs
- Token usage tracked in `tokenUsage` field

**State management (Zustand):**
- `src/store/chat-store.ts` → Model selection (persisted with backward-compatible migration)
- `src/store/new-chat-store.ts` → Pre-chat server selection
- `src/store/header-store.ts` → Breadcrumb state

## Key Library Utilities

**`src/lib/chat-utils.ts`:**
- `generateMessageId` → Uses AI SDK's `createIdGenerator({ prefix: "msg" })`

**`src/lib/composition.ts`:**
- `composeRefs()`, `useComposedRefs()` → Radix UI ref composition pattern

**`src/lib/encryption.ts`:**
- AES-256-CBC with random IVs
- Returns `{ iv: string, data: string }` objects stored as JSONB

**`src/lib/oauth2.ts`:**
- Full OAuth 2.1 server implementation
- Uses `@node-oauth/oauth2-server` library
- Custom database model adapter for Drizzle ORM

**`src/lib/models-dev.ts`:**
- Fetches model metadata from `models.dev` API
- 24-hour caching for model lists

## Key Conventions

1. **Zod:** Import from `zod/v4` (not default)
2. **IDs:** Use `generateId()` from `src/lib/id.ts` OR `ai` package; for messages use `createIdGenerator({ prefix: "msg" })`
3. **Client components:** Add `"use client"` only for interactive UI/hooks/browser APIs
4. **Path aliases:** Use `@/` prefix for all internal imports
5. **Error handling:** Return `{ content: [...], isError: true }` from tool callbacks
6. **Async/await:** Always use async/await (no promise chaining)
7. **Streamdown:** Use `streamdown` package for streaming markdown rendering

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

## Testing

**Vitest + Testing Library:**
```bash
pnpm test  # Run all tests
```

**Pattern:** Extract pure functions for testing (avoid React rendering in tests)
```typescript
// Extract parsing logic to pure functions
function parseJsonSchema(schema) { ... }

// Test just the logic
describe("Schema Parser", () => {
	it("should parse basic JSON schema", () => { ... })
})
```

## Code Quality

**Biome** (replaces ESLint/Prettier):
- Tab indentation enforced
- Ignores: `src/routeTree.gen.ts`
- Pre-commit: Type check + lint + build

**Important:** Never manually edit `src/routeTree.gen.ts` - it's auto-generated.
