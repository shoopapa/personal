---
name: lint
description: Run pnpm lint and fix all lint errors. Use when the user wants to lint the project or fix lint issues.
allowed-tools: Bash(pnpm lint), Bash(pnpm lint:fix), Edit, Read, Glob, Grep
---

Run `pnpm lint` to check for lint errors, then fix all of them.

Steps:
1. Run `pnpm lint` and capture the output
2. Analyze the errors reported
3. Fix each lint error by editing the relevant files
4. Re-run `pnpm lint` to confirm all errors are resolved
5. If errors remain, continue fixing until the lint passes clean

When fixing errors:
- Follow the existing code style in each file
- Do not reformat code beyond what is needed to fix the lint error
- Do not add unnecessary comments or refactor unrelated code
