---
name: format
description: Run pnpm format and fix all formatting issues. Use when the user wants to format the project or fix formatting issues.
allowed-tools: Bash(pnpm format), Bash(pnpm format:fix), Edit, Read, Glob, Grep
---

Run `pnpm format` to check for formatting issues, then fix all of them.

Steps:
1. Run `pnpm format` and capture the output
2. Analyze the files reported as unformatted
3. Run `pnpm format:fix` to automatically fix all formatting issues
4. Re-run `pnpm format` to confirm all issues are resolved
5. If issues remain, continue fixing until the format check passes clean

When fixing issues:
- Use `pnpm format:fix` to apply fixes automatically rather than editing files manually
- Do not make any other changes beyond formatting
