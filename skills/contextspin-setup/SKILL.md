---
name: contextspin-setup
description: >
  This skill should be used when the user wants to "setup contextspin",
  "configure contextspin", "add org context to the spinner", "connect my tools
  to the Claude spinner", "install contextspin", "show my PRs while Claude thinks",
  or "replace the loading text with live data". Use this skill to do a one-shot
  setup or to reconfigure existing sources.
metadata:
  version: "0.2.0"
  npm: "https://www.npmjs.com/package/contextspin"
  github: "https://github.com/mannutech/contextspin"
---

## What ContextSpin does

ContextSpin shows live snippets from the user's own org — open PRs, Slack mentions,
upcoming meetings, incidents, failing CI — in the Claude Code statusline (default)
or, opt-in, in the spinner words themselves. It polls user-configured **sources**
and injects the results while Claude is thinking.

---

## Do the setup in one pass

Set this up in a single pass. Do NOT gate on step-by-step confirmations, do NOT
show the config and wait for approval, and do NOT write long explanations. Detect,
write, wire, report. Ask at most ONE brief question and only if truly required
(e.g. a different config already exists at `~/.contextspin.json` and you'd overwrite
it). Otherwise just do it.

### 1. Detect available sources

Pick a couple of high-value sources from what the user actually has:

- **MCP servers in this session** — if the user has connected Slack, GitHub,
  GitLab, Jira, Linear, Notion, Google Calendar, PagerDuty, Datadog, or Grafana,
  those are available as `mcp` sources. See `references/source-examples.md` for
  copy-paste configs.
- **CLI tools** — one quick check:
  ```bash
  for c in gh glab kubectl; do command -v "$c" >/dev/null 2>&1 && echo "$c"; done
  ```

### 2. Assemble a small Tier-1 config

Build a lean config with statusline mode and only a couple of high-value sources
(don't pile on everything). Tier-1 = time-sensitive and actionable: PRs awaiting
review, unread Slack @mentions, meetings in the next 30 min, active incidents,
failing CI. If nothing is detected, fall back to a `gh` PR + CI pair (it costs
nothing when `gh` is absent — that source just yields no snippets). An empty
`sources` array is also valid (the daemon still wires up and shows nothing), but
prefer seeding the `gh` pair so there's something to show.

```json
{
  "sources": [ /* a couple of Tier-1 sources */ ],
  "injection": { "mode": "statusline", "refresh": 30 },
  "snippets": {
    "deduplication": true,
    "cooldownAfterShown": 3,
    "priorityOrder": ["incident", "ci", "slack", "calendar", "github", "jira"]
  }
}
```

Use `"mode": "patcher"` ONLY if the user explicitly asked for the spinner words to
change. Statusline is the default and is wired non-destructively (any existing
statusline command is preserved and ContextSpin appends beneath it).

### 3. Write the config

```bash
cat > ~/.contextspin.json << 'EOF'
{ <assembled config> }
EOF
```

### 4. Wire and start

One command wires the statusline (non-destructively) and starts the daemon:

```bash
npx --yes contextspin@^0.2.0 ensure
```

### 5. Report (2-3 lines)

Tell the user what is now live and how to tweak it. For example:

> ContextSpin is live in your statusline, polling GitHub PRs and Slack mentions
> every 30s. You'll see snippets from your next session.
> Tweak sources in `~/.contextspin.json` or just ask me to add/remove a source.
