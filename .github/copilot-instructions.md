# Remote MCP Development Guide

Remote MCP is a cloud platform for creating and managing Model Context Protocol (MCP) servers that connect AI clients to external services (GitHub, Slack, PostgreSQL, etc.).

## Architecture Overview

### Core Stack
- **Frontend/Backend**: TanStack Start (SSR React) + Vite
- **Database**: PostgreSQL with Drizzle ORM (`src/db/schema.ts`)
- **Auth**: Better Auth with email/password + OAuth (Google, GitHub)
- **API Layer**: tRPC for type-safe APIs + TanStack Router server functions
- **Encryption**: AES-256-CBC for sensitive credentials (`src/lib/encryption.ts`)
- **MCP Integration**: `@socotra/modelcontextprotocol-sdk` for MCP server implementation
- **Error Tracking**: Sentry (configured in `vite.config.ts`)

### Key Data Flow
1. Users authenticate via Better Auth (`src/lib/auth.ts`)
2. Users create MCP servers with app connections (OAuth2 or API keys)
3. Credentials encrypted and stored in `app_connection` table
4. MCP servers exposed at `/api/mcp/{token}` using OAuth 2.1 for client auth
5. AI clients connect to MCP endpoints, authenticate via OAuth, and invoke tools
6. Tool calls proxied through app integrations (`src/app/mcp/apps/`)

## Routing & Server Functions

**TanStack Router** with file-based routing in `src/routes/`:
- `_authed/` - Protected routes (require authentication)
- `api/` - API endpoints using `createServerFileRoute().methods({})`
- Route params use `$` prefix (e.g., `servers.$id.tsx`)

**Creating routes**: Create empty file in `src/routes/`, dev server auto-generates boilerplate.

**Server functions** (`createServerFn`) in `src/services/`:
```typescript
// Pattern: validator + middleware + handler
export const myFunction = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .middleware([userRequiredMiddleware]) // Auth check
  .handler(async ({ data, context }) => { /* ... */ });
```

**Auth middleware**: Use `userRequiredMiddleware` from `src/services/auth.api.ts` for protected server functions.

## tRPC Procedures

Create routers in `src/integrations/trpc/router/`, import in `src/integrations/trpc/index.ts`:

```typescript
import { createTRPCRouter, protectedProcedure } from "../init";

export const myRouter = createTRPCRouter({
  myQuery: protectedProcedure.query(async ({ ctx }) => {
    // ctx.user and ctx.session available
  }),
});
```

**Two auth patterns**:
- tRPC: `protectedProcedure` (checks Better Auth session)
- Server functions: `userRequiredMiddleware`

## MCP App Integration

**Adding new MCP apps** (`src/app/mcp/apps/`):

1. Create app directory (e.g., `github/`)
2. Define app with `createMcpApp()`:
```typescript
export const myApp = createMcpApp({
  name: "myapp",
  displayName: "My App",
  auth: oauthProperty({ /* OAuth config */ }),
  tools: [/* tool configs */],
  categories: [McpAppCategory.DEVELOPER_TOOLS],
});
```
3. Register in `src/app/mcp/apps/index.ts`

**Tools**: Defined in `tools/` subdirectory, registered via `registerTool()` with handler functions.

**Authentication**: OAuth2 or API key, credentials encrypted via `src/lib/encryption.ts`.

## Database

**Drizzle ORM** with PostgreSQL:
- Schema: `src/db/schema.ts` (users, sessions, mcp_server, app_connection, etc.)
- Migrations: `pnpm db:generate` → `pnpm db:migrate`
- Studio: `pnpm db:studio`

**Key tables**:
- `app_connection`: Encrypted OAuth tokens/API keys per user per app
- `mcp_server`: User-created MCP servers with OAuth client credentials
- `mcp_run`: Logs of MCP tool executions

## UI Components

**shadcn/ui**: Install with `pnpx shadcn@latest add <component>`

**Biome**: Formatting/linting (not ESLint/Prettier)
- `pnpm check` - lint & format check
- `pnpm format` - auto-fix

## Environment Setup

Required env vars (`src/env.ts`):
- `DATABASE_URL` - PostgreSQL connection
- `ENCRYPTION_KEY` - 32-byte key for AES-256
- `BETTER_AUTH_SECRET` - Auth secret
- `MCP_SERVER_API_KEY` - Internal API key for MCP endpoints
- OAuth credentials (Google, GitHub - optional)

## Pre-Commit Checklist

Always run before committing:
```bash
pnpm tsc --noEmit  # Type check
pnpm check         # Biome lint
pnpm lint          # Additional linting
pnpm build         # Production build
```

Configured with `husky` + `lint-staged`.
