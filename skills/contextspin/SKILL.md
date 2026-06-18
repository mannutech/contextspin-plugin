---
name: contextspin
description: >
  This skill should be used for anything ContextSpin: "contextspin status",
  "what's in my statusline", "add a weather/GitHub/Slack/calendar source",
  "remove a source", "turn off jokes", "contextspin not working", "fix
  contextspin", "restart/stop/start contextspin", "re-inject", "configure
  contextspin", or showing what live data is feeding the Claude Code statusline.
  ContextSpin auto-configures on install, so there is rarely anything to "set up"
  — this skill is mostly for inspecting and tweaking sources.
metadata:
  version: "0.6.0"
  npm: "https://www.npmjs.com/package/contextspin"
  github: "https://github.com/mannutech/contextspin"
---

ContextSpin shows live snippets — weather, a fresh joke, the top Hacker News
story, PRs awaiting your review, and anything else you configure — in the Claude
Code statusline. It polls user-configured **sources** and composes the result
non-destructively beneath any existing statusline.

**It already works on install.** The SessionStart hook seeds a no-credentials
starter pack (weather, joke, Hacker News) and the bar is never empty. So don't
"set it up" from scratch unless the user asks — just inspect or tweak.

## Do it in one pass

Run the right command for what the user asked, then report in 1–3 lines. No
confirmation gates, no essays.

> **Always run `npx` from a neutral directory** (e.g. prefix with `cd /tmp &&`).
> If the current working directory is the `contextspin` source repo — or any dir
> whose `package.json` is named `contextspin` — `npx` resolves the un-linked local
> package and fails with `Exit 127: contextspin: command not found`. The CLI
> operates on absolute `~/.contextspin*` paths regardless of cwd, so `cd /tmp`
> is always safe. Canonical form:
>
> ```bash
> cd /tmp && npx --yes contextspin@^0.5.0 <cmd>
> ```

| User asks | `<cmd>` | Then say |
|---|---|---|
| status / "what's in my statusline" | `status` | List the cached snippets (or note it's empty/stale) |
| start / stop / restart / refresh | `start` / `stop` / `restart` | "Daemon started/stopped/restarted." |
| inject / wire / "not showing up" | `inject` | "Wired into your statusline (non-destructive)." |
| uninject / remove from bar | `uninject` | "Removed from your statusline." |
| not working / fix it | `ensure` | Re-creates config, re-wires statusline, starts daemon. Report what `status` then shows. |

`status` prints the daemon state and cached snippets — present them as a short
list, e.g.:

```
Statusline is live (daemon up, 4 sources):
• 🌤️ Dubai, Dubai, AE: ☀️ +33°C
• 😄 Why do programmers prefer dark mode? Because light attracts bugs.
• 📰 HN: Swiss parliament lifts ban on new nuclear power plants
```

If `status` shows the daemon down or the statusline missing, run `ensure`
(idempotent: re-creates config + re-wires + starts) and report the new `status`.

## Add / remove / tweak a source

Sources live in `~/.contextspin.json` under `sources`. Edit it with a JSON merge
(never sed), then `restart`. See `references/source-examples.md` for copy-paste
configs (GitHub PRs, Slack, calendar, Jira, PagerDuty, k8s, and more — plus the
no-credential starter pack).

```bash
node -e "const fs=require('fs');const p=process.env.HOME+'/.contextspin.json';const c=JSON.parse(fs.readFileSync(p));
// e.g. add a source:
c.sources.push({type:'http',url:'https://wttr.in/?format=3',format:'🌤️ {{text}}',label:'weather',cooldown:1800,maxSnippets:1});
// or remove one by label:
// c.sources = c.sources.filter(s => s.label !== 'joke');
fs.writeFileSync(p,JSON.stringify(c,null,2));"
cd /tmp && npx --yes contextspin@^0.5.0 restart
```

- **Disable the styled box / colors:** set `injection.style` to `false`.
- **Change refresh cadence:** `injection.refresh` (seconds).
- **Spinner words** (experimental binary patch): only if the user explicitly
  asks — set `injection.mode` to `patcher`. Statusline is the default.

## Source types

- **http** — any public/authed endpoint (`url`, optional `headers`, `jq`, `format`).
- **cli** — a shell command whose output is parsed (`command`, `jq`/`filter`, `format`).
- **mcp** — a tool from an MCP server connected in the session (`tool`, `args`, `format`).

ContextSpin does NOT fetch data itself — it composes signals you already have.

## Shadowing fix (a repo ships its own statusline)

A repo's tracked `.claude/settings.json` outranks user settings and can shadow
ContextSpin. `inject`/`ensure` handle this: when a project dir is known they
compose the wrapper into that project's `.claude/settings.local.json` (gitignored,
outranks the tracked file), preserving the prior statusline. If it works
everywhere except one repo, run `ensure` from inside that repo.

## File locations

| File | Purpose |
|---|---|
| `~/.contextspin.json` | User config (sources, injection, snippets) |
| `~/.contextspin-cache.json` | Live snippet cache |
| `~/.contextspin/daemon.pid` | Daemon PID |
| `~/.contextspin/daemon.log` | Daemon logs |
