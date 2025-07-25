/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as RedirectImport } from './routes/redirect'
import { Route as LoginImport } from './routes/login'
import { Route as AuthedImport } from './routes/_authed'
import { Route as AuthedIndexImport } from './routes/_authed/index'
import { Route as AuthedSettingsImport } from './routes/_authed/settings'
import { Route as AuthedRunsImport } from './routes/_authed/runs'
import { Route as AuthedServersIndexImport } from './routes/_authed/servers/index'
import { Route as AuthedConnectionsIndexImport } from './routes/_authed/connections/index'
import { Route as AuthedAppsIndexImport } from './routes/_authed/apps/index'
import { Route as AuthedServersIdImport } from './routes/_authed/servers/$id'
import { Route as AuthedAppsIdImport } from './routes/_authed/apps/$id'

// Create/Update Routes

const RedirectRoute = RedirectImport.update({
  id: '/redirect',
  path: '/redirect',
  getParentRoute: () => rootRoute,
} as any)

const LoginRoute = LoginImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const AuthedRoute = AuthedImport.update({
  id: '/_authed',
  getParentRoute: () => rootRoute,
} as any)

const AuthedIndexRoute = AuthedIndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => AuthedRoute,
} as any)

const AuthedSettingsRoute = AuthedSettingsImport.update({
  id: '/settings',
  path: '/settings',
  getParentRoute: () => AuthedRoute,
} as any)

const AuthedRunsRoute = AuthedRunsImport.update({
  id: '/runs',
  path: '/runs',
  getParentRoute: () => AuthedRoute,
} as any)

const AuthedServersIndexRoute = AuthedServersIndexImport.update({
  id: '/servers/',
  path: '/servers/',
  getParentRoute: () => AuthedRoute,
} as any)

const AuthedConnectionsIndexRoute = AuthedConnectionsIndexImport.update({
  id: '/connections/',
  path: '/connections/',
  getParentRoute: () => AuthedRoute,
} as any)

const AuthedAppsIndexRoute = AuthedAppsIndexImport.update({
  id: '/apps/',
  path: '/apps/',
  getParentRoute: () => AuthedRoute,
} as any)

const AuthedServersIdRoute = AuthedServersIdImport.update({
  id: '/servers/$id',
  path: '/servers/$id',
  getParentRoute: () => AuthedRoute,
} as any)

const AuthedAppsIdRoute = AuthedAppsIdImport.update({
  id: '/apps/$id',
  path: '/apps/$id',
  getParentRoute: () => AuthedRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_authed': {
      id: '/_authed'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthedImport
      parentRoute: typeof rootRoute
    }
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginImport
      parentRoute: typeof rootRoute
    }
    '/redirect': {
      id: '/redirect'
      path: '/redirect'
      fullPath: '/redirect'
      preLoaderRoute: typeof RedirectImport
      parentRoute: typeof rootRoute
    }
    '/_authed/runs': {
      id: '/_authed/runs'
      path: '/runs'
      fullPath: '/runs'
      preLoaderRoute: typeof AuthedRunsImport
      parentRoute: typeof AuthedImport
    }
    '/_authed/settings': {
      id: '/_authed/settings'
      path: '/settings'
      fullPath: '/settings'
      preLoaderRoute: typeof AuthedSettingsImport
      parentRoute: typeof AuthedImport
    }
    '/_authed/': {
      id: '/_authed/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof AuthedIndexImport
      parentRoute: typeof AuthedImport
    }
    '/_authed/apps/$id': {
      id: '/_authed/apps/$id'
      path: '/apps/$id'
      fullPath: '/apps/$id'
      preLoaderRoute: typeof AuthedAppsIdImport
      parentRoute: typeof AuthedImport
    }
    '/_authed/servers/$id': {
      id: '/_authed/servers/$id'
      path: '/servers/$id'
      fullPath: '/servers/$id'
      preLoaderRoute: typeof AuthedServersIdImport
      parentRoute: typeof AuthedImport
    }
    '/_authed/apps/': {
      id: '/_authed/apps/'
      path: '/apps'
      fullPath: '/apps'
      preLoaderRoute: typeof AuthedAppsIndexImport
      parentRoute: typeof AuthedImport
    }
    '/_authed/connections/': {
      id: '/_authed/connections/'
      path: '/connections'
      fullPath: '/connections'
      preLoaderRoute: typeof AuthedConnectionsIndexImport
      parentRoute: typeof AuthedImport
    }
    '/_authed/servers/': {
      id: '/_authed/servers/'
      path: '/servers'
      fullPath: '/servers'
      preLoaderRoute: typeof AuthedServersIndexImport
      parentRoute: typeof AuthedImport
    }
  }
}

// Create and export the route tree

interface AuthedRouteChildren {
  AuthedRunsRoute: typeof AuthedRunsRoute
  AuthedSettingsRoute: typeof AuthedSettingsRoute
  AuthedIndexRoute: typeof AuthedIndexRoute
  AuthedAppsIdRoute: typeof AuthedAppsIdRoute
  AuthedServersIdRoute: typeof AuthedServersIdRoute
  AuthedAppsIndexRoute: typeof AuthedAppsIndexRoute
  AuthedConnectionsIndexRoute: typeof AuthedConnectionsIndexRoute
  AuthedServersIndexRoute: typeof AuthedServersIndexRoute
}

const AuthedRouteChildren: AuthedRouteChildren = {
  AuthedRunsRoute: AuthedRunsRoute,
  AuthedSettingsRoute: AuthedSettingsRoute,
  AuthedIndexRoute: AuthedIndexRoute,
  AuthedAppsIdRoute: AuthedAppsIdRoute,
  AuthedServersIdRoute: AuthedServersIdRoute,
  AuthedAppsIndexRoute: AuthedAppsIndexRoute,
  AuthedConnectionsIndexRoute: AuthedConnectionsIndexRoute,
  AuthedServersIndexRoute: AuthedServersIndexRoute,
}

const AuthedRouteWithChildren =
  AuthedRoute._addFileChildren(AuthedRouteChildren)

export interface FileRoutesByFullPath {
  '': typeof AuthedRouteWithChildren
  '/login': typeof LoginRoute
  '/redirect': typeof RedirectRoute
  '/runs': typeof AuthedRunsRoute
  '/settings': typeof AuthedSettingsRoute
  '/': typeof AuthedIndexRoute
  '/apps/$id': typeof AuthedAppsIdRoute
  '/servers/$id': typeof AuthedServersIdRoute
  '/apps': typeof AuthedAppsIndexRoute
  '/connections': typeof AuthedConnectionsIndexRoute
  '/servers': typeof AuthedServersIndexRoute
}

export interface FileRoutesByTo {
  '/login': typeof LoginRoute
  '/redirect': typeof RedirectRoute
  '/runs': typeof AuthedRunsRoute
  '/settings': typeof AuthedSettingsRoute
  '/': typeof AuthedIndexRoute
  '/apps/$id': typeof AuthedAppsIdRoute
  '/servers/$id': typeof AuthedServersIdRoute
  '/apps': typeof AuthedAppsIndexRoute
  '/connections': typeof AuthedConnectionsIndexRoute
  '/servers': typeof AuthedServersIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/_authed': typeof AuthedRouteWithChildren
  '/login': typeof LoginRoute
  '/redirect': typeof RedirectRoute
  '/_authed/runs': typeof AuthedRunsRoute
  '/_authed/settings': typeof AuthedSettingsRoute
  '/_authed/': typeof AuthedIndexRoute
  '/_authed/apps/$id': typeof AuthedAppsIdRoute
  '/_authed/servers/$id': typeof AuthedServersIdRoute
  '/_authed/apps/': typeof AuthedAppsIndexRoute
  '/_authed/connections/': typeof AuthedConnectionsIndexRoute
  '/_authed/servers/': typeof AuthedServersIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | ''
    | '/login'
    | '/redirect'
    | '/runs'
    | '/settings'
    | '/'
    | '/apps/$id'
    | '/servers/$id'
    | '/apps'
    | '/connections'
    | '/servers'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/login'
    | '/redirect'
    | '/runs'
    | '/settings'
    | '/'
    | '/apps/$id'
    | '/servers/$id'
    | '/apps'
    | '/connections'
    | '/servers'
  id:
    | '__root__'
    | '/_authed'
    | '/login'
    | '/redirect'
    | '/_authed/runs'
    | '/_authed/settings'
    | '/_authed/'
    | '/_authed/apps/$id'
    | '/_authed/servers/$id'
    | '/_authed/apps/'
    | '/_authed/connections/'
    | '/_authed/servers/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  AuthedRoute: typeof AuthedRouteWithChildren
  LoginRoute: typeof LoginRoute
  RedirectRoute: typeof RedirectRoute
}

const rootRouteChildren: RootRouteChildren = {
  AuthedRoute: AuthedRouteWithChildren,
  LoginRoute: LoginRoute,
  RedirectRoute: RedirectRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/_authed",
        "/login",
        "/redirect"
      ]
    },
    "/_authed": {
      "filePath": "_authed.tsx",
      "children": [
        "/_authed/runs",
        "/_authed/settings",
        "/_authed/",
        "/_authed/apps/$id",
        "/_authed/servers/$id",
        "/_authed/apps/",
        "/_authed/connections/",
        "/_authed/servers/"
      ]
    },
    "/login": {
      "filePath": "login.tsx"
    },
    "/redirect": {
      "filePath": "redirect.tsx"
    },
    "/_authed/runs": {
      "filePath": "_authed/runs.tsx",
      "parent": "/_authed"
    },
    "/_authed/settings": {
      "filePath": "_authed/settings.tsx",
      "parent": "/_authed"
    },
    "/_authed/": {
      "filePath": "_authed/index.tsx",
      "parent": "/_authed"
    },
    "/_authed/apps/$id": {
      "filePath": "_authed/apps/$id.tsx",
      "parent": "/_authed"
    },
    "/_authed/servers/$id": {
      "filePath": "_authed/servers/$id.tsx",
      "parent": "/_authed"
    },
    "/_authed/apps/": {
      "filePath": "_authed/apps/index.tsx",
      "parent": "/_authed"
    },
    "/_authed/connections/": {
      "filePath": "_authed/connections/index.tsx",
      "parent": "/_authed"
    },
    "/_authed/servers/": {
      "filePath": "_authed/servers/index.tsx",
      "parent": "/_authed"
    }
  }
}
ROUTE_MANIFEST_END */
