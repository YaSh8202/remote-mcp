# AGENTS.md

This guide is for AI coding agents working in the Remote MCP codebase. It covers essential commands, code style, and conventions.

## Quick Commands

### Development
```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build (includes type checking)
pnpm serve        # Preview production build
```

### Testing
```bash
pnpm test                                    # Run all tests (vitest)
vitest run src/components/__tests__/SchemaDisplay.test.ts  # Run single test file
vitest run -t "should parse basic JSON schema"            # Run test by name
```

### Code Quality
```bash
pnpm check        # Run Biome linter + formatter check
pnpm format       # Auto-fix formatting issues
pnpm lint         # Lint only (no formatting)
```

### Database
```bash
pnpm db:generate  # Generate migration from schema changes
pnpm db:migrate   # Apply pending migrations
pnpm db:studio    # Open Drizzle Studio (GUI)
```

## Code Style & Conventions

### Formatting (Enforced by Biome)
- **Indentation**: ALWAYS use tabs (never spaces)
- **Quotes**: Double quotes for strings (`"hello"` not `'hello'`)
- **Semicolons**: Automatic (Biome handles this)
- **Line length**: No strict limit, but be reasonable
- **Auto-ignored files**: `src/routeTree.gen.ts`, `src/components/ai-elements/**/*`

### TypeScript Strictness
- Strict mode enabled (`tsconfig.json`)
- No unused locals or parameters
- No unchecked side effect imports
- Always use explicit return types for exported functions
- Use `type` for object shapes, `interface` only for extensibility

### Imports
```typescript
// ✅ CORRECT: Use zod/v4
import { z } from "zod/v4";

// ✅ CORRECT: Use path aliases
import { db } from "@/db";
import { getUserSession } from "@/lib/auth-server";

// ❌ WRONG: Don't use relative imports for cross-directory files
import { db } from "../../db";

// ✅ CORRECT: Group imports (Biome auto-organizes)
// 1. External packages
// 2. Internal @/ imports
// 3. Relative imports
```

### Naming Conventions
- **Files**: kebab-case (`user-settings-service.ts`, `mcp-server.tsx`)
- **Components**: PascalCase (`ModelSelector.tsx`, `DataTable.tsx`)
- **Functions**: camelCase (`getUserSession`, `createMcpApp`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants (`MCP_SERVER_API_KEY`)
- **Types/Interfaces**: PascalCase (`UserSession`, `McpAppConfig`)
- **Database tables**: snake_case (`mcp_server`, `app_connection`)

### ID Generation
```typescript
// ✅ For general IDs
import { generateId } from "@/lib/id";
const serverId = generateId();

// ✅ For chat/message IDs (AI SDK pattern)
import { generateMessageId } from "ai";
const messageId = generateMessageId();
```

### Async/Await (NEVER use promise chaining)
```typescript
// ✅ CORRECT
async function getUser(id: string) {
	const user = await db.query.users.findFirst({ where: eq(users.id, id) });
	if (!user) throw new Error("User not found");
	return user;
}

// ❌ WRONG
function getUser(id: string) {
	return db.query.users.findFirst({ where: eq(users.id, id) })
		.then(user => {
			if (!user) throw new Error("User not found");
			return user;
		});
}
```

### Error Handling

**For tool callbacks** (MCP apps):
```typescript
// Return errors as content with isError flag
return {
	content: [{ type: "text", text: "Failed to fetch data: API timeout" }],
	isError: true,
};
```

**For API endpoints** (tRPC/server functions):
```typescript
// Use TRPCError in tRPC routers
throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });

// Use json() in server functions
throw json({ message: "Unauthorized" }, { status: 401 });
```

**For general code**:
```typescript
// Throw descriptive errors
throw new Error(`Failed to decrypt credentials: ${error.message}`);
```

### "use client" Directive
Only add `"use client"` for:
- Components using React hooks (`useState`, `useEffect`, etc.)
- Browser APIs (`localStorage`, `window`, `document`)
- Third-party client-only libraries

```typescript
// ✅ CORRECT: Interactive component
"use client";
import { useState } from "react";

// ❌ WRONG: Server component doesn't need it
import { db } from "@/db";
```

## Architecture Patterns

### API Layer (Two Patterns)

**Pattern 1: tRPC** (for client-side data fetching)
```typescript
// src/integrations/trpc/router/my-router.ts
import { createTRPCRouter, protectedProcedure } from "../init";
import { z } from "zod/v4";

export const myRouter = createTRPCRouter({
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			// ctx.user and ctx.session available
			return db.query.myTable.findFirst({ where: eq(myTable.id, input.id) });
		}),
});
```

**Pattern 2: Server Functions** (for route-specific logic)
```typescript
// src/services/my-service.ts
import { createServerFn } from "@tanstack/react-start";
import { userRequiredMiddleware } from "./auth.api";
import { z } from "zod/v4";

export const myFunction = createServerFn({ method: "GET" })
	.validator(z.object({ id: z.string() }))
	.middleware([userRequiredMiddleware])
	.handler(async ({ data, context }) => {
		// context.userSession available
		return { /* data */ };
	});
```

### Database Queries
```typescript
// ✅ CORRECT: Use Drizzle query API
const user = await db.query.users.findFirst({
	where: eq(users.id, userId),
	with: { settings: true },  // Eager load relations
});

// ✅ CORRECT: For complex queries
const servers = await db
	.select()
	.from(mcpServer)
	.where(and(eq(mcpServer.ownerId, userId), eq(mcpServer.isActive, true)))
	.orderBy(desc(mcpServer.createdAt));
```

### Credential Encryption
```typescript
import { encryptObject, decryptObject } from "@/lib/encryption";

// Always encrypt sensitive data before storing
const encrypted = encryptObject({ accessToken: "secret" });
await db.insert(appConnections).values({ connectionValue: encrypted });

// Decrypt when needed
const decrypted = decryptObject(connection.connectionValue);
```

## Testing Best Practices

1. **Extract pure functions** for easier testing (avoid React rendering)
2. **Use describe/it blocks** from Vitest
3. **Test files**: `__tests__/ComponentName.test.ts` or co-located `Component.test.ts`
4. **Mock external dependencies** (DB, APIs) when needed

## Pre-Commit Checks (Husky + lint-staged)

Automatically runs:
1. `tsc --noEmit` - Type checking
2. `biome check --write` - Lint + format
3. `pnpm build` - Verify production build

If any fail, commit is blocked. Fix issues before committing.

## Common Gotchas

1. **Never edit** `src/routeTree.gen.ts` - it's auto-generated
2. **Always use** `zod/v4` import (not default zod)
3. **Never log** decrypted credentials (security violation)
4. **Use `@/` prefix** for all internal imports (path alias)
5. **Tab indentation** is enforced - spaces will fail linting
6. **Pre-commit hooks run build** - ensure code compiles before committing
