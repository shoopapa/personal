---
name: check
description: Run pnpm format:fix, then fix typecheck errors, then fix lint errors. Use when the user wants to run a full check and fix cycle.
allowed-tools: Bash(pnpm format), Bash(pnpm format:fix), Bash(pnpm typecheck), Bash(pnpm lint), Bash(pnpm lint:fix), Edit, Read, Glob, Grep
---

Run a full check-and-fix cycle in this order: format, typecheck, lint.

Steps:
1. Run `pnpm format:fix` to automatically fix all formatting issues
2. Run `pnpm typecheck` and capture the output
3. Analyze all TypeScript errors reported
4. Fix each typecheck error by editing the relevant files
5. Re-run `pnpm typecheck` to confirm all errors are resolved — continue fixing until it passes clean
6. Run `pnpm lint` and capture the output
7. Analyze all lint errors reported
8. Fix each lint error by editing the relevant files
9. Re-run `pnpm lint` to confirm all errors are resolved — continue fixing until it passes clean

When fixing errors:
- Follow the existing code style in each file
- Do not reformat code beyond what is needed to fix the error
- Do not add unnecessary comments or refactor unrelated code
- Fix typecheck errors completely before moving on to lint
- Prefer proper type annotations over `any` or unsafe casts
