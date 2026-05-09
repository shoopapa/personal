# Project Rules

## Monorepo Structure
- App code in `apps/nextjs`
- Shared backend logic in `packages/api` (routers, context)
- Auth in `packages/auth`
- Prefer adding shared logic to packages rather than duplicating in apps
- Use `pnpm dev`, `pnpm build`, `pnpm typecheck` via Turbo
- Always use pnpm catalog when possible, when install check if a version already exists there first

## File Placement
- New routes: `apps/nextjs/src/app/<route>/page.tsx`, colocate components under `app/_components` or route-local `_components/`
- New tRPC routers: `packages/api/src/router/<domain>.ts`, wire in `root.ts`
- Shared validation schemas: `packages/validators`

## Next.js
- Prefer React Server Components by default; add `"use client"` only for hooks/state/event handlers/browser APIs
- App Router only — no `pages/` directory or legacy data fetching
- Use `~/` path alias for app-local imports, `@acme/*` for workspaces
- tRPC for app data needs; avoid ad-hoc REST fetches
- For tRPC in RSC, use the exported `trpc` proxy and `prefetch` utilities; wrap client pages in `TRPCReactProvider` & `HydrationBoundary`

## tRPC
- Define routers/procedures in `packages/api/src/router/*` using helpers from `packages/api/src/trpc.ts`
- `publicProcedure` for unauthenticated calls, `protectedProcedure` when session is required
- Zod for input validation
- Keep routers stateless/pure; no side effects at import time

## Auth
- Use `initAuth` from `@acme/auth` and the `auth` instance from `apps/nextjs/src/auth/server.ts`
- Use `ctx.session` from tRPC context for server logic — do not read cookies/session manually
- Gate UI on the server when possible; avoid client-only auth checks unless needed
- Never log or commit secrets

## UI & Tailwind
- Tailwind v4
- Maintain accessibility: keyboard navigation and ARIA on interactive elements

## TypeScript
- Explicit types on exported functions, public APIs, and complex values — avoid `any` and unsafe casts
- Use `import type` where appropriate
- Named exports preferred; avoid default exports when a module exposes multiple constructs
- Strict null checks — handle nullable values explicitly
- ESM syntax throughout

## Lint & Format
- Do not add ESLint disables broadly; if needed, scope to a single line with justification
- Conform to Prettier and shared ESLint config — do not change formatting rules
- Keep imports ordered and free of unused imports

### Code Intelligence
Prefer LSP over Grep/Read for code navigation — it's faster, precise, and avoids reading entire files:
- `workspaceSymbol` to find where something is defined
- `findReferences` to see all usages across the codebase
- `goToDefinition` / `goToImplementation` to jump to source
- `hover` for type info without reading the file

Use Grep only when LSP isn't available or for text/pattern searches (comments, strings, config).

After writing or editing code, check LSP diagnostics and fix errors before proceeding.