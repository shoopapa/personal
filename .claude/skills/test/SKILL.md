---
name: test
description: Fix e2e test regressions after dependency updates or code changes. Resets the DB, runs tests, diagnoses failures, and fixes application code (not tests) until green. Do NOT use to write new tests or modify existing test files.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, Agent, LSP
---

You are fixing e2e test regressions — tests that used to pass but broke after a dependency update or code change. Your job is to get the tests green again by fixing **application code**, not by modifying test files.

## What this skill does NOT do

- Write new tests
- Modify files in `apps/e2e/tests/`
- Modify `apps/e2e/fixtures.ts`, `apps/e2e/helpers/`, or `apps/e2e/global-setup.ts` unless there is a clear regression in the test infrastructure itself (e.g. a helper broke due to a DB schema change)

---

## Step 1 — Reset the DB and clear auth state

Stale DB data and cached auth sessions cause spurious failures. Clear them before running anything.

```bash
# Wipe the .auth directory (cached Playwright sessions)
rm -rf apps/e2e/.auth

# Roll back all migrations against the test DB, then reapply
# Run from packages/db so the relative .env.test path resolves correctly
cd packages/db
pnpm dotenv -e ../../.env.test -- pnpm tsx src/migrate.ts bottom
pnpm dotenv -e ../../.env.test -- pnpm tsx src/migrate.ts latest
cd ../..
```

---

## Step 2 — Build the app for test

Playwright runs against a standalone Next.js build. Always rebuild after code changes.

```bash
pnpm build
```

---

## Step 3 — Run the e2e tests and capture output

```bash
pnpm --filter @acme/e2e test 2>&1 | tee /tmp/e2e-output.txt
```

Read the output. For each failing test note:
- The test name and file
- The error message and stack trace
- Which selector, URL, or assertion failed

---

## Step 4 — Diagnose the root cause

Work through failures systematically. Common causes after dep updates or code changes:

| Symptom | Likely cause |
|---|---|
| `page.waitForURL` timeout | Route changed, redirect broke, or middleware rejecting requests |
| Selector not found | UI component renamed, restructured, or behind a feature flag |
| Auth setup fails (`.auth/admin.json` not written) | Magic-link endpoint changed, session shape changed, or DB schema mismatch |
| DB insert error in setup | Schema migration missing or column renamed |
| `500` / API errors in test output | tRPC procedure broken, type mismatch, or missing env var |
| TypeScript errors at runtime | Mismatched types after dep update — run `pnpm typecheck` to surface |

Use LSP (`hover`, `goToDefinition`, `findReferences`) and `Grep` to trace the failure back to the source. Read relevant application files before editing them.

---

## Step 5 — Fix application code

Fix the broken application code — routes, components, tRPC procedures, auth handlers, DB queries. Follow the rules in CLAUDE.md:

- Do not touch test files unless the test helper itself is broken due to a schema/API change
- Check LSP diagnostics after every edit: `LSP diagnostics`
- Run `pnpm typecheck` if types are suspect

---

## Step 6 — Rebuild and rerun

After each fix, rebuild and rerun to confirm progress:

```bash
pnpm build && pnpm --filter @acme/e2e test 2>&1 | tee /tmp/e2e-output.txt
```

Repeat Steps 4–6 until all tests pass.

---

## Step 7 — Final clean run

Once tests appear to pass, do one final clean run from a fresh state to rule out flakiness:

```bash
rm -rf apps/e2e/.auth
cd apps/e2e && pnpm playwright test --reporter=list
```

All tests must pass before declaring done.
