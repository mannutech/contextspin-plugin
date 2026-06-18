# Source Config Examples

Ready-made source configs for common tools. Copy the relevant blocks into the
user's `~/.contextspin.json` sources array during setup.

---

## Starter pack (no credentials needed)

These three `http` sources work with zero setup — no tokens, no auth, no MCP — so
they're handy for confirming the statusline is wired before you add real sources.
`wttr.in` and `icanhazdadjoke` return plain text (mapped to `{{text}}`); the Hacker
News Firebase API returns JSON.

### Weather (HTTP)

```json
{
  "type": "http",
  "url": "https://wttr.in/?format=3",
  "format": "🌤️ {{text}}",
  "label": "weather",
  "cooldown": 1800,
  "maxSnippets": 1
}
```

### Random dad joke (HTTP)

```json
{
  "type": "http",
  "url": "https://icanhazdadjoke.com/",
  "headers": {
    "Accept": "text/plain",
    "User-Agent": "ContextSpin (github.com/mannutech/contextspin)"
  },
  "format": "😄 {{text}}",
  "label": "joke",
  "cooldown": 3600,
  "maxSnippets": 1
}
```

### Hacker News — top story (HTTP, Firebase API)

```json
{
  "type": "http",
  "url": "https://hacker-news.firebaseio.com/v0/topstories.json",
  "jq": ".[0]",
  "format": "📰 HN top: news.ycombinator.com/item?id={{value}}",
  "label": "hackernews",
  "cooldown": 600,
  "maxSnippets": 1
}
```

> The Firebase API returns story **IDs**, so this surfaces a link to the top item.
> A single source can't chain the second call (`/v0/item/<id>.json`) for the title;
> for the title in one request use Algolia instead —
> `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=1` with `"jq": ".hits[0].title"`.

---

## Slack (MCP)

```json
{
  "type": "mcp",
  "tool": "slack_search_public_and_private",
  "args": { "query": "mentions:me is:unread" },
  "format": "💬 Slack: {{text}}",
  "label": "slack",
  "cooldown": 120,
  "maxSnippets": 2
}
```

## GitHub — PRs needing your review (CLI)

```json
{
  "type": "cli",
  "command": "gh pr list --review-requested @me --json title,number --limit 3",
  "format": "🔀 PR #{{number}} needs review: {{title}}",
  "label": "github",
  "cooldown": 120,
  "maxSnippets": 3
}
```

## GitHub — your PRs with failing CI (CLI)

```json
{
  "type": "cli",
  "command": "gh run list --json status,name,headBranch --limit 10",
  "filter": "{{status}} == 'failure'",
  "format": "❌ CI failed: {{name}} ({{headBranch}})",
  "label": "ci",
  "cooldown": 60,
  "maxSnippets": 2
}
```

## Google Calendar — next meeting (MCP)

```json
{
  "type": "mcp",
  "tool": "calendar_list_events",
  "args": { "timeMin": "now", "maxResults": 1, "orderBy": "startTime" },
  "format": "📅 Meeting in {{minutesUntil}}min: {{summary}}",
  "label": "calendar",
  "cooldown": 60,
  "maxSnippets": 1
}
```

## Jira — tickets assigned to you (MCP)

```json
{
  "type": "mcp",
  "tool": "jira_search_issues",
  "args": { "jql": "assignee = currentUser() AND status != Done ORDER BY updated DESC", "maxResults": 3 },
  "format": "🎫 {{key}}: {{summary}}",
  "label": "jira",
  "cooldown": 300,
  "maxSnippets": 2
}
```

## Linear — issues assigned to you (MCP)

```json
{
  "type": "mcp",
  "tool": "linear_search_issues",
  "args": { "assignedTo": "me", "states": ["Todo", "In Progress"], "limit": 3 },
  "format": "📐 {{identifier}}: {{title}}",
  "label": "linear",
  "cooldown": 300,
  "maxSnippets": 2
}
```

## PagerDuty — active incidents (MCP or HTTP)

```json
{
  "type": "http",
  "url": "https://api.pagerduty.com/incidents?statuses[]=triggered&statuses[]=acknowledged&limit=3",
  "headers": {
    "Authorization": "Token token={{env.PAGERDUTY_TOKEN}}",
    "Accept": "application/vnd.pagerduty+json;version=2"
  },
  "jq": ".incidents[].title",
  "format": "🔴 Incident: {{value}}",
  "label": "incident",
  "cooldown": 30,
  "maxSnippets": 3
}
```

## Grafana — error rate (HTTP)

```json
{
  "type": "http",
  "url": "https://grafana.yourorg.com/api/datasources/proxy/1/query?query=error_rate",
  "headers": { "Authorization": "Bearer {{env.GRAFANA_TOKEN}}" },
  "jq": ".data.result[0].value[1]",
  "format": "📊 Error rate: {{value}}%",
  "label": "grafana",
  "cooldown": 30,
  "maxSnippets": 1
}
```

## Kubernetes — unhealthy pods (CLI)

```json
{
  "type": "cli",
  "command": "kubectl get pods --all-namespaces --field-selector=status.phase!=Running -o json 2>/dev/null",
  "jq": ".items[].metadata.name",
  "format": "⚠️ Pod unhealthy: {{value}}",
  "label": "k8s",
  "cooldown": 30,
  "maxSnippets": 2
}
```

## Notion — tasks assigned to you (MCP)

```json
{
  "type": "mcp",
  "tool": "notion-search",
  "args": { "query": "assigned to me" },
  "format": "📋 Notion: {{title}}",
  "label": "notion",
  "cooldown": 300,
  "maxSnippets": 2
}
```

## Gmail — unread from specific senders (MCP)

```json
{
  "type": "mcp",
  "tool": "search_threads",
  "args": { "q": "is:unread from:boss@company.com OR from:alerts@company.com" },
  "format": "📧 Email: {{subject}}",
  "label": "email",
  "cooldown": 120,
  "maxSnippets": 2
}
```

---

## Full example config (Tier 1 only)

A sensible starting config for most developers:

```json
{
  "sources": [
    {
      "type": "mcp",
      "tool": "slack_search_public_and_private",
      "args": { "query": "mentions:me is:unread" },
      "format": "💬 Slack: {{text}}",
      "label": "slack",
      "cooldown": 120,
      "maxSnippets": 2
    },
    {
      "type": "cli",
      "command": "gh pr list --review-requested @me --json title,number --limit 3",
      "format": "🔀 PR #{{number}} needs review: {{title}}",
      "label": "github",
      "cooldown": 120,
      "maxSnippets": 3
    },
    {
      "type": "cli",
      "command": "gh run list --json status,name,headBranch --limit 10",
      "filter": "{{status}} == 'failure'",
      "format": "❌ CI failed: {{name}} ({{headBranch}})",
      "label": "ci",
      "cooldown": 60,
      "maxSnippets": 2
    }
  ],
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
