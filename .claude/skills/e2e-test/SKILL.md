---
name: e2e-test
description: Write, structure, or add e2e Playwright tests for this repo. Use when the user asks how to create or maintain e2e tests, or when writing a new test file in apps/e2e.
allowed-tools: Read, Glob, Grep, Write, Edit
---

Tests live in `apps/e2e/tests/`. No pre-seeding required — factories create all needed data and clean up after.

## Patterns

**1. Shared admin session** — for smoke/navigation tests with no custom data needs.
```typescript
import { expect, test } from "@playwright/test";

test("dashboard loads", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
});
```

**2. Isolated DB data** — import from `../fixtures` to get a fresh user + org deleted after the test. The `page` still uses the shared admin session.
```typescript
import { expect, test } from "../fixtures";

test("shows org name", async ({ page, testUser }) => {
  await page.goto("/organization");
  await expect(page.getByText(testUser.org.name)).toBeVisible();
});
```

**3. Second authenticated session** — `authenticatedPage` is a fresh browser context logged in as a new user.
```typescript
import { test } from "../fixtures";

test("new user lands on dashboard", async ({ authenticatedPage }) => {
  await authenticatedPage.waitForURL(/\/dashboard/);
});
```

**4. No session** — bypass the shared admin session entirely.
```typescript
test("redirects to sign-in", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: undefined });
  const page = await ctx.newPage();
  await page.goto("/dashboard");
  await page.waitForURL(/\/sign-in/);
  await ctx.close();
});
```

## Adding factories

Add to `apps/e2e/helpers/db.ts`:
```typescript
export async function createTestTraining(organizationId: string, overrides?: { duration?: number }) {
  return db.insertInto("training").values({
    organizationId,
    duration: overrides?.duration ?? 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returningAll().executeTakeFirstOrThrow();
}
```

Then add cleanup to `cleanupTestData` in the same file **before** the org/user deletes it depends on (FK-safe order: children first, parents last).

## Rules

- Default values use `crypto.randomUUID()` to prevent cross-run collisions
- Fixture teardown always runs (Playwright uses try/finally) — no manual `afterEach` needed when using fixtures
- Never hardcode emails or slugs — always generate unique values
