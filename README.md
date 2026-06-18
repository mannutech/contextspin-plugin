# ContextSpin Plugin

Replaces Claude Code's whimsical spinner text ("Flibbertigibbeting…", "Discombobulating…")
with live snippets from your org — open PRs, Slack mentions, upcoming meetings, active
incidents, failing CI, Jira tickets, Grafana metrics, and more.

Built on top of the [contextspin](https://www.npmjs.com/package/contextspin) npm package.

## Don't want the plugin? One-line install

You don't need this plugin (or the marketplace) at all — the same setup is a
single command, which wires a self-healing SessionStart hook directly into your
`~/.claude/settings.json`:

```bash
curl -fsSL https://raw.githubusercontent.com/mannutech/contextspin/main/install.sh | bash
```

`npx contextspin install` does the same; `npx contextspin uninstall` removes
everything. The plugin is just a marketplace-friendly wrapper around this.

## Components

| Component | Purpose |
|---|---|
| Skill: `contextspin` | One skill for everything — status, add/remove sources, tweaks, troubleshooting |
| MCP Server: `contextspin` | Exposes daemon control and live snippet data to Claude |
| Hook: SessionStart | Auto-configures + starts the polling daemon at the beginning of each session |

## Setup

Nothing to do. After installing the plugin, the SessionStart hook auto-configures
a no-credentials starter pack (weather, a dad joke, the top Hacker News story) and
wires your statusline — so the bar is live (and never empty) from the next session.

Just ask Claude when you want to change anything:

> "Add my GitHub review requests to the statusline"

Or edit `~/.contextspin.json` directly (see [source examples](skills/contextspin/references/source-examples.md)).

## Usage

| What you say | What happens |
|---|---|
| "What's in my statusline right now?" | Shows live snippets from cache |
| "Contextspin isn't working" | Diagnoses and fixes daemon/injection issues |
| "Add my Jira tickets to the statusline" | Adds a new source to your config |
| "Remove the joke source" | Removes a source from your config |
| "Turn off the colors" | Sets `injection.style: false` |

## Uninstalling

> ⚠️ **Removing this plugin does NOT remove ContextSpin from your statusline.**
> The plugin is only a bootstrapper — the actual statusline wiring lives in your
> `~/.claude/settings.json` and a background daemon, written there by the setup
> hook. Claude can't clean those up when you remove the plugin. To fully remove
> ContextSpin (restore your statusline, drop the hook, stop the daemon):
>
> ```bash
> npx contextspin uninstall
> ```

## Source types

ContextSpin pulls from three source types — whatever you already have connected:

- **`mcp`** — any MCP tool you have connected (Slack, GitHub, Jira, Calendar, etc.)
- **`cli`** — any local shell command (`gh`, `kubectl`, custom scripts)
- **`http`** — any HTTP endpoint (Grafana, PagerDuty, internal APIs)

See [source-examples.md](skills/contextspin/references/source-examples.md) for ready-made configs.

## MCP Tools

This plugin exposes four MCP tools:

| Tool | Description |
|---|---|
| `get_snippets` | Current snippets in cache |
| `get_daemon_status` | Daemon running state, PID, last update |
| `start_daemon` | Start the polling daemon |
| `stop_daemon` | Stop the daemon |

## Links

- npm: https://www.npmjs.com/package/contextspin
- GitHub: https://github.com/mannutech/contextspin
