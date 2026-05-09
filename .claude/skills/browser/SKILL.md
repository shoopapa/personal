---
name: browser
description: Browse the web, interact with pages, fill forms, and extract data using a real browser via Playwright CLI. Use when user says 'open this page', 'browse to', 'fill out the form', 'scrape this site', 'take a screenshot', 'test this URL', 'check this website'. Do NOT use for web research across multiple sources (use /research-web instead).
---

# /browser — Browser Automation via Playwright CLI

Control a real browser to navigate pages, interact with elements, fill forms, extract data, and test websites using the \`playwright-cli\` command-line tool.

## Critical Rules

- **Install before first use** — run \`npm install -g @playwright/cli@latest\` if not already installed.
- **Use snapshots to find element refs** — never guess refs, always snapshot first.
- **One action at a time** — wait for each command to complete before the next.
- **Close sessions when done** — don't leave browsers hanging.
- **`open` always starts a new browser** — every call to `playwright-cli open` opens a fresh browser process and destroys any existing session and cookies. After the initial login `open`, navigate exclusively with `click`, `back`, `forward`, `snapshot`, `screenshot`, and `wait`. Never call `open` again mid-session.

## Setup

Before using browser commands, check if Playwright CLI is installed:

\`\`\`bash
playwright-cli --version
\`\`\`

If not found, install it:

\`\`\`bash
npm install -g @playwright/cli@latest
\`\`\`

## Commands

All commands are run via Bash. The CLI manages browser sessions automatically.

### Navigation
\`\`\`bash
playwright-cli open <url>              # Open a URL
playwright-cli back                     # Go back
playwright-cli forward                  # Go forward
playwright-cli wait                     # Wait for page to settle
\`\`\`

### Reading the page
\`\`\`bash
playwright-cli snapshot                 # Get accessibility snapshot with element refs
playwright-cli screenshot               # Capture a screenshot
playwright-cli screenshot --full        # Full-page screenshot
\`\`\`

### Interaction
\`\`\`bash
playwright-cli click <ref>             # Click an element by ref from snapshot
playwright-cli type "text"              # Type text into focused field
playwright-cli select <ref> "value"     # Select from dropdown
playwright-cli press Enter              # Press a key
playwright-cli drag <from-ref> <to-ref> # Drag between elements
\`\`\`

### Sessions
\`\`\`bash
playwright-cli sessions                 # List open sessions
playwright-cli close                    # Close current session
\`\`\`

## Workflow

1. **Open** the target URL
2. **Snapshot** to see element refs
3. **Click/type** using refs from the snapshot
4. **Snapshot** again to verify the result
5. **Close** when done

### Example: fill out a form

\`\`\`bash
playwright-cli open "https://example.com/signup"
playwright-cli snapshot                  # find the form field refs
playwright-cli click e12                 # click "Name" field (ref from snapshot)
playwright-cli type "Jane Doe"
playwright-cli press Tab
playwright-cli type "jane@example.com"
playwright-cli click e18                 # click "Submit" button
playwright-cli snapshot                  # verify success message
playwright-cli close
\`\`\`

### Example: take a screenshot for a PR

\`\`\`bash
playwright-cli open "http://localhost:3000/dashboard"
playwright-cli wait
playwright-cli screenshot --full
playwright-cli close
\`\`\`

## Starting the dev environment

Always run the dev server from the **current working directory** (the worktree you are in), never from the parent monorepo root. Running from the wrong directory means the server serves compiled code from a different branch, not your changes.

If the local dev server isn't running, reset and start it:

```bash
# Tear down containers, run fresh migrations + seeding
pnpm --filter @acme/db nuke

# Start the dev server from the current worktree
pnpm dev
```

`pnpm --filter @acme/db nuke` handles docker down/up, migrate bottom→latest, codegen, and all seed data in one shot.

## Logging in to the local app

Run all scripts from the **current working directory** (the worktree). The worktree needs a `.env` symlink pointing at the parent's `.env` — create it if missing:

```bash
# One-time: symlink .env into the worktree so scripts can read DB/auth vars
ln -sf /Users/joedavis/code/lightning/.env /Users/joedavis/code/lightning/A/.env
```

Then generate a magic login link:

```bash
pnpm --filter @acme/scripts generate:login-links
```

This prints a login URL for each standard dev account (joe@lightninglms.com, dan@lightninglms.com). Open it in the browser **once** and never call `open` again:

```bash
playwright-cli open "http://localhost:3000/api/auth/lightning/verify?token=<token>"
playwright-cli wait
playwright-cli snapshot   # verify you're logged in — check Page URL redirected to /dashboard
```

The `--base-url` flag on generate:login-links is **non-functional** (it's a boolean flag, not a string option). To log in to a server on a different port, generate the link normally and swap the port in the URL manually:

```bash
# Generate link (always produces localhost:3000 URL)
pnpm --filter @acme/scripts generate:login-links
# Then manually substitute the port before opening:
playwright-cli open "http://localhost:3001/api/auth/lightning/verify?token=<token>"
```

### Switching organizations after login

Use only clicks — never `open` — to switch orgs and stay logged in:

```bash
playwright-cli snapshot                        # find the user menu button ref (e.g. e130)
playwright-cli click e130                      # open user menu
playwright-cli snapshot | grep "menuitem"      # find the org menu item ref
playwright-cli click <org-menu-ref>            # expand org list
playwright-cli snapshot | grep "option"        # find the target org option ref
playwright-cli click <org-option-ref>          # switch org (auto-navigates to dashboard)
playwright-cli wait
playwright-cli snapshot                        # verify new org heading and metrics
```

## Verifying the right server is running

Before testing, confirm the running server is actually serving your current worktree code:

```bash
lsof -p <pid> 2>/dev/null | grep cwd
```

If it shows `.next/standalone` or a path outside the current worktree, that server is running compiled code from a different branch. Start a dev server from the current working directory instead — use a different port if :3000 is taken:

```bash
PORT=3001 pnpm dev &   # starts from cwd on :3001
sleep 10               # wait for "Ready"
```

Then swap the port in the login link URL manually (see above).

## Troubleshooting

**"command not found: playwright-cli"**
\`\`\`bash
npm install -g @playwright/cli@latest
\`\`\`

**Page not loading / timeout:**
Use \`playwright-cli wait\` after opening — SPAs need time to render.

**Logged out unexpectedly mid-session:**
You called `playwright-cli open` again. That opens a new browser with no cookies. There is no recovery — generate a new login link and start over. Next time, navigate with clicks only.

**Can't find an element:**
Take a fresh \`playwright-cli snapshot\` — the page state may have changed. Always use refs from the latest snapshot.

**Changes not reflected in the running app:**
The running server may be the compiled parent build, not your worktree dev server. Check with `lsof -p <pid> | grep cwd` and start a worktree dev server if needed (see above).

**Headless environment (CI, SSH):**
The CLI runs headed by default. Pass \`--headless\` to \`open\`:
\`\`\`bash
playwright-cli open --headless "https://example.com"
\`\`\`