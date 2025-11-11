// Note: registerGlobalMiddleware is deprecated in TanStack Start v1.135+
// Sentry is now initialized via instrument.server.mjs and client-side init in router.tsx
// This file is kept for reference but the middleware registration has been removed

// TODO: Migrate to new Sentry setup pattern:
// - Client: Add Sentry.init() in router.tsx with tanstackRouterBrowserTracingIntegration
// - Server: Create instrument.server.mjs at project root
// - Update package.json scripts to use --import ./instrument.server.mjs

// Placeholder export to keep the file as a valid module
export {};
