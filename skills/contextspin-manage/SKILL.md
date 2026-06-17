---
name: contextspin-manage
description: >
  This skill should be used when the user asks about "contextspin status",
  "what's currently in my spinner", "show me my spinner snippets", "contextspin
  not working", "fix contextspin", "add a new source to contextspin", "remove a
  source", "restart the contextspin daemon", "update my contextspin config", or
  any troubleshooting related to ContextSpin. Also use when the user wants to
  know what live data is feeding into their Claude Code spinner or statusline.
metadata:
  version: "0.2.0"
---

## MCP tools

Prefer these over Bash for live data:

| Tool | What it does |
|---|---|
| `mcp__contextspin__get_snippets` | Current snippets in the cache |
| `mcp__contextspin__get_daemon_status` | Daemon state, PID, last update |
| `mcp__contextspin__start_daemon` | Start the polling daemon |
| `mcp__contextspin__stop_daemon` | Stop the daemon |

## Requests

**"What's in my spinner?"** — Call `get_snippets`, present as a list. If empty/stale,
also call `get_daemon_status` to diagnose. Format:
```
Your spinner is showing 4 snippets:
• 🔀 PR #247 needs review: fix auth token expiry  (GitHub, 2m ago)
• 💬 Slack: @you in #backend — quick question  (Slack, 5m ago)
• 📅 Meeting in 8min: Sprint Planning  (Calendar, 1m ago)
• ❌ CI failed: test-suite on feature/payments  (CI, 3m ago)
```

**"Not working" / "still silly words"** — Diagnose in order, fixing as you go:
1. `get_daemon_status` — running? If not, `start_daemon`.
2. `cat ~/.contextspin.json` — check `injection.mode`.
3. If `statusline`: `cat ~/.claude/settings.json | grep -A3 statusLine`. If the
   ContextSpin line is missing, run `npx --yes contextspin@^0.2.0 ensure` (re-wires
   non-destructively and starts the daemon).
4. If `patcher`: a Claude Code update wipes the patch — re-apply with
   `npx --yes contextspin@^0.2.0 inject --mode patcher`, then restart Claude Code.

**"Add a source"** — Read config, build the source object (`mcp`/`cli`/`http`),
write it back with a JSON merge (never sed), restart the daemon:
```bash
node -e "const fs=require('fs');const p=process.env.HOME+'/.contextspin.json';const c=JSON.parse(fs.readFileSync(p));c.sources.push(<new source>);fs.writeFileSync(p,JSON.stringify(c,null,2));"
```
Then `stop_daemon` + `start_daemon`.

**"Remove a source"** — Same pattern, `splice` by index instead of `push`, then
restart the daemon.

**"Restart / refresh"** — `stop_daemon`, then `start_daemon`, confirm with
`get_daemon_status`.

**"Change refresh interval"** — Edit `injection.refresh` (seconds) in
`~/.contextspin.json`, restart the daemon.

## Source types

```
mcp   → calls a connected MCP tool (tool name + args)
cli   → runs a shell command (must output JSON)
http  → hits an HTTP endpoint (supports jq extraction)
```
All support: `format` (template with `{{field}}`), `cooldown` (seconds),
`maxSnippets`, `label` (used by `priorityOrder`).

## File locations

| File | Purpose |
|---|---|
| `~/.contextspin.json` | User config |
| `~/.contextspin-cache.json` | Live snippet cache |
| `~/.contextspin/daemon.pid` | Daemon PID |
| `~/.contextspin/daemon.log` | Daemon logs (with `--log`) |
