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
  version: "0.1.0"
---

## Available MCP tools

This plugin provides a `contextspin` MCP server with four tools. Use them to
get live data rather than running Bash commands where possible.

| Tool | What it does |
|---|---|
| `mcp__contextspin__get_snippets` | Returns current snippets in the cache |
| `mcp__contextspin__get_daemon_status` | Returns daemon running state, PID, last update time |
| `mcp__contextspin__start_daemon` | Starts the background polling daemon |
| `mcp__contextspin__stop_daemon` | Stops the daemon |

---

## Handling common requests

### "What's in my spinner right now?"

Call `mcp__contextspin__get_snippets` and present the results in a clean list.
If the cache is empty or stale, also call `mcp__contextspin__get_daemon_status`
to diagnose why.

Example response format:
```
Your spinner is currently showing 4 snippets:
• 🔀 PR #247 needs review: fix auth token expiry  (GitHub, 2m ago)
• 💬 Slack: @you in #backend — quick question  (Slack, 5m ago)
• 📅 Meeting in 8min: Sprint Planning  (Calendar, 1m ago)
• ❌ CI failed: test-suite on feature/payments  (CI, 3m ago)
```

### "Contextspin isn't working" / "My spinner is still showing silly words"

Diagnose in order:

1. Call `mcp__contextspin__get_daemon_status` — is the daemon running?
2. If not running, call `mcp__contextspin__start_daemon`
3. Check injection mode: run `cat ~/.contextspin.json` and confirm `injection.mode`
4. If mode is `statusline`, check Claude Code settings:
   ```bash
   cat ~/.claude/settings.json | grep -A3 statusline
   ```
   If missing, run: `npx contextspin inject`
5. If mode is `patcher`, check if Claude Code was recently updated — the patch
   needs to be re-applied: `npx contextspin inject --mode patcher`

### "Add a new source"

1. Read the current config: `cat ~/.contextspin.json`
2. Ask the user what they want to add (tool name, what data, what format)
3. Build the new source object (refer to source types: `mcp`, `cli`, `http`)
4. Show them the updated `sources` array
5. Write back with confirmation:
   ```bash
   # Use a proper JSON merge, not sed
   node -e "
     const fs = require('fs');
     const cfg = JSON.parse(fs.readFileSync(process.env.HOME + '/.contextspin.json'));
     cfg.sources.push(<new source>);
     fs.writeFileSync(process.env.HOME + '/.contextspin.json', JSON.stringify(cfg, null, 2));
   "
   ```
6. Restart the daemon: call `mcp__contextspin__stop_daemon` then `mcp__contextspin__start_daemon`

### "Remove a source"

1. Call `get_snippets` and `cat ~/.contextspin.json` to show current sources with indices
2. Ask which source to remove (by label or index)
3. Remove it via node script (same pattern as add, but splice instead of push)
4. Restart the daemon

### "Restart / refresh"

Call `mcp__contextspin__stop_daemon`, then `mcp__contextspin__start_daemon`.
Confirm with `mcp__contextspin__get_daemon_status`.

### "Change refresh interval"

Edit `injection.refresh` in `~/.contextspin.json` (value is seconds). Restart daemon.

---

## Source type quick reference

```
mcp   → calls a connected MCP tool (tool name + args)
cli   → runs a shell command (must output JSON)
http  → hits an HTTP endpoint (supports jq for extraction)
```

All sources support:
- `format` — template string, `{{fieldName}}` interpolation
- `cooldown` — seconds between re-fetches
- `maxSnippets` — max items this source contributes at once
- `label` — used for `priorityOrder` in snippets config

---

## Daemon file locations

| File | Purpose |
|---|---|
| `~/.contextspin.json` | User config |
| `~/.contextspin-cache.json` | Live snippet cache |
| `~/.contextspin/daemon.pid` | Daemon PID |
| `~/.contextspin/daemon.log` | Daemon logs (if `--log` flag used) |
