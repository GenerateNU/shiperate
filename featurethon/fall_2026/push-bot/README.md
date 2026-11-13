# fall_2026 push-bot 🍂

Slack bot that listens for GitHub push webhooks on the `featurethon` branch of the featurethon repos and posts
to Slack with silly titles, achievement badges, a running team scoreboard, and a random bonus (meme, joke,
dad joke, useless fact, advice, dog, or http.cat).

| Repo | Team |
| --- | --- |
| `boutline` | 🥊 Boutline |
| `inspirate-consulting` | 💡 Inspirate Consulting |
| `birdie-and-claire` | 🐦 Birdie & Claire |
| `tomoji` | 🍅 Tomoji |

## Running

```bash
bun install
bun run dev        # watch mode, DRY_RUN=1 (prints Slack payload instead of posting)
bun run sample     # in another terminal: send fixtures/push.json to the local bot
bun run sample fixtures/push.json boutline   # same payload, different repo
bun run start      # for real
```

Paste the printed `blocks` into [Block Kit Builder](https://app.slack.com/block-kit-builder) to preview.

## Env

| Var | |
| --- | --- |
| `SERVER_PORT` | default `3000` |
| `SLACK_WEBHOOK` | Slack incoming webhook URL. If unset, the bot runs in dry-run mode. |
| `GITHUB_WEBHOOK_SECRET` | optional; when set, `X-Hub-Signature-256` is verified |
| `SCOREBOARD_PATH` | optional JSON file to persist standings across restarts |
| `DRY_RUN` | `1` to log instead of posting |

`GET /api/scoreboard` returns the current standings.

## Where to add content

- `src/flavor.ts` — titles, descriptors, reactions, message templates, milestone lines
- `src/achievements.ts` — badge rules (each is a function: contributor → badge or nothing)
- `src/content.ts` — bonus content sources and their weights
- `src/teams.ts` — repo → team mapping
