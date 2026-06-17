---
name: contextspin-setup
description: >
  This skill should be used when the user wants to "setup contextspin",
  "configure contextspin", "add org context to the spinner", "connect my tools
  to the Claude spinner", "install contextspin", "show my PRs while Claude thinks",
  or "replace the loading text with live data". Use this skill to guide the user
  through a first-time setup or to reconfigure existing sources.
metadata:
  version: "0.1.0"
  npm: "https://www.npmjs.com/package/contextspin"
  github: "https://github.com/mannutech/contextspin"
---

## What ContextSpin does

ContextSpin replaces Claude Code's whimsical spinner text ("Flibbertigibbeting…",
"Discombobulating…") with live snippets from the user's own org — open PRs, Slack
mentions, upcoming meetings, active incidents, failing CI, Jira tickets, and more.

It works by polling user-configured **sources** and injecting the results into the
Claude Code spinner or statusline while Claude is thinking.

---

## Setup flow

Work through these steps in order. Do not skip ahead.

### Step 1 — Check installation

Run a Bash command to check if `contextspin` is already installed:

```bash
npx contextspin@latest --version 2>/dev/null || echo "NOT_INSTALLED"
```

If not installed, tell the user to run:
```bash
npm install -g contextspin
```
Wait for them to confirm before continuing.

### Step 2 — Choose injection mode

Ask the user which injection mode they want:

- **Statusline** (recommended) — uses Claude Code's official statusline API. Safe,
  survives updates, shows context in the bottom bar while Claude thinks.
- **Spinner patcher** — replaces the actual spinning words. More visible, but needs
  to be re-patched after each Claude Code update.
- **Both** — statusline as primary, patcher as a bonus.

Default to statusline unless they ask for the patcher.

### Step 3 — Detect and configure sources

Look at the conversation context for any MCP servers the user has connected. Common
ones to look for: Slack, GitHub, GitLab, Jira, Linear, Notion, Google Calendar,
PagerDuty, Datadog, Grafana.

For each detected integration, suggest a ready-made source config from the reference
file. See `references/source-examples.md` for copy-paste configs for each tool.

Also ask: "Do you have any CLI tools you want to pull from? (e.g., `gh`, `kubectl`,
`jira`)"

Build the full `sources` array based on their answers.

### Step 4 — Write the config

Write the assembled config to `~/.contextspin.json` using Bash:

```bash
cat > ~/.contextspin.json << 'EOF'
{
  <assembled config here>
}
EOF
```

Show the user the config before writing and ask for confirmation.

The config structure:

```json
{
  "sources": [ /* assembled from Step 3 */ ],
  "injection": {
    "mode": "statusline",
    "refresh": 30
  },
  "snippets": {
    "deduplication": true,
    "cooldownAfterShown": 3,
    "priorityOrder": ["incident", "ci", "slack", "calendar", "github", "jira"]
  }
}
```

### Step 5 — Start and inject

Run these two commands:

```bash
npx contextspin start
npx contextspin inject
```

Tell the user: "The daemon is now running. You'll see live snippets in your Claude
Code spinner/statusline from your next session. You can check what's currently
queued with `npx contextspin status`."

---

## Priority guidance

Help the user prioritize sources by impact tier:

**Tier 1 (most valuable — time-sensitive, needs action):**
- Upcoming meetings in next 30 min
- Active PagerDuty/OpsGenie incidents
- Failing CI on your own PRs
- Unread Slack @mentions
- PRs waiting for your review

**Tier 2 (ambient ops awareness):**
- Deployments in progress
- K8s pod anomalies
- Error rate spikes (Grafana/Datadog)

**Tier 3 (work queue):**
- Jira/Linear tickets due today
- Sprint end date with open ticket count

Recommend Tier 1 sources only for first setup. Suggest Tier 2/3 as opt-in.

---

## Common mistakes to avoid

- Do not write `~/.contextspin.json` without showing the user the content first.
- Do not start the daemon until the config is confirmed.
- If the user has no MCP servers connected, guide them toward `cli` type sources
  using tools they likely have installed (`gh`, `kubectl`, `jira-cli`).
