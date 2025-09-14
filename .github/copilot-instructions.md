## Tanstack Router/Start
This project uses Tanstack Router/Start for routing. You can find the main router configuration in `src/router.tsx`.
Filesystem routes - src/routes/\*.tsx

For creating new routes, first create a new empty file in the `src/routes` directory using your preferred method (e.g., touch command in terminal). Dev Server will automatically pick up the new file and create a route for it and add the starter code.

## Error collection

Error collection is automatic and configured in `src/router.tsx`.

# shadcn instructions

Use the latest version of Shadcn to install new components, like this command to add a button component:

```bash
pnpx shadcn@latest add button
```

# trpc instructions

When you create a new tRPC router, you can use the `createTRPCRouter` function from `src/integrations/trpc/init.ts`. This function is already set up with Sentry and error handling.

add new router in the `src/integrations/trpc/router` directory, and then import it in `src/integrations/trpc/index.ts` to make it available in the app.

## Type and Lint check

To run type and lint checks, use the following command:

After completing your task, run the following commands to ensure everything is in order:

```bash
pnpm tsc --noEmit
pnpm check
pnpm lint
pnpm build
```
