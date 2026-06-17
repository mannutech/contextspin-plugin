# ContextSpin Plugin

Replaces Claude Code's whimsical spinner text ("Flibbertigibbeting…", "Discombobulating…")
with live snippets from your org — open PRs, Slack mentions, upcoming meetings, active
incidents, failing CI, Jira tickets, Grafana metrics, and more.

Built on top of the [contextspin](https://www.npmjs.com/package/contextspin) npm package.

## Components

| Component | Purpose |
|---|---|
| Skill: `contextspin-setup` | First-time setup wizard — detects your connected MCPs and writes `~/.contextspin.json` |
| Skill: `contextspin-manage` | Check status, view live snippets, add/remove sources, troubleshoot |
| MCP Server: `contextspin` | Exposes daemon control and live snippet data to Claude |
| Hook: SessionStart | Auto-starts the polling daemon at the beginning of each session |

## Prerequisites

Install the `contextspin` npm package:

```bash
npm install -g contextspin
```

## Setup

After installing the plugin, ask Claude:

> "Setup contextspin"

Claude will walk you through connecting your tools and writing your config.

Or set it up manually:

1. Write `~/.contextspin.json` (see [source examples](skills/contextspin-setup/references/source-examples.md))
2. Run `npx contextspin inject` to install the statusline/patcher
3. Run `npx contextspin start` to start the daemon

## Usage

| What you say | What happens |
|---|---|
| "Setup contextspin" | Guided first-time config wizard |
| "What's in my spinner right now?" | Shows live snippets from cache |
| "Contextspin isn't working" | Diagnoses and fixes daemon/injection issues |
| "Add my Jira tickets to the spinner" | Adds a new source to your config |
| "Remove the Grafana source" | Removes a source from your config |

## Source types

ContextSpin pulls from three source types — whatever you already have connected:

- **`mcp`** — any MCP tool you have connected (Slack, GitHub, Jira, Calendar, etc.)
- **`cli`** — any local shell command (`gh`, `kubectl`, custom scripts)
- **`http`** — any HTTP endpoint (Grafana, PagerDuty, internal APIs)

See [source-examples.md](skills/contextspin-setup/references/source-examples.md) for ready-made configs.

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
