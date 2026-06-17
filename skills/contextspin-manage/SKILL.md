---
name: contextspin-manage
description: >
  This skill should be used when the user asks about "contextspin status",
  "what review requests are waiting on me", "show me my spinner snippets",
  "contextspin not working", "fix contextspin", "restart the contextspin daemon",
  "stop/start contextspin", "re-inject contextspin", "update my contextspin
  config", or any troubleshooting related to ContextSpin. Also use when the user
  wants to know what live data is feeding into their Claude Code statusline.
metadata:
  version: "0.3.0"
---

ContextSpin shows the review requests waiting on you (PRs/MRs where you're the
requested reviewer, via `gh`/`glab`) in your Claude Code statusline. Injection is
statusline-only — composed non-destructively beneath any existing statusline.

## Do it in one pass

Run the right `npx contextspin` command for what the user asked, then report in
1-3 lines. No confirmation gates, no essays. All commands accept `npx --yes
contextspin@^0.3.0 <cmd>`.

| User asks | Command | Then say |
|---|---|---|
| status / "what's in my statusline" | `status` | List the cached review requests (or note it's empty/stale) |
| start | `start` | "Daemon started." |
| stop | `stop` | "Daemon stopped." |
| restart / refresh | `restart` | "Daemon restarted." |
| inject / wire / "not showing up" | `inject` | "Wired into your statusline (non-destructive)." |
| uninject / remove | `uninject` | "Removed from your statusline." |
| not working / fix it | `ensure` | Re-creates config, re-wires statusline, starts daemon. Report what `status` then shows. |

`status` prints the daemon state and the cached snippets — present them as a short
list, e.g.:

```
2 review requests waiting on you:
• PR #247 fix auth token expiry — acme/api (2m ago)
• MR !88 bump deps — acme/web (5m ago)
```

If `status` shows the daemon down or the statusline missing, run `ensure` (idempotent:
re-creates config + re-wires + starts) and report the new `status`.

## Shadowing fix (project ships its own statusline)

A repo's tracked `.claude/settings.json` outranks user settings and shadows
ContextSpin. `inject`/`ensure` handle this: when a project dir is known they compose
the wrapper into that project's `.claude/settings.local.json` (gitignored, outranks
the tracked `settings.json`), preserving the prior statusline. If the user reports it
working everywhere except one repo, run `ensure` from inside that repo.

## Editing the source

The only default source is review-requests-waiting-on-you via `gh`/`glab` (uses
existing CLI auth, no tokens). To tweak it, edit `~/.contextspin.json` with a JSON
merge (never sed), then `restart`:

```bash
node -e "const fs=require('fs');const p=process.env.HOME+'/.contextspin.json';const c=JSON.parse(fs.readFileSync(p));/* mutate c */;fs.writeFileSync(p,JSON.stringify(c,null,2));"
```

Adjust refresh cadence via `injection.refresh` (seconds) in the same file, then
`restart`.

## File locations

| File | Purpose |
|---|---|
| `~/.contextspin.json` | User config |
| `~/.contextspin-cache.json` | Live snippet cache |
| `~/.contextspin/daemon.pid` | Daemon PID |
| `~/.contextspin/daemon.log` | Daemon logs |
