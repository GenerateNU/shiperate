# fall_2026 push-bot 🍂

Slack bot that listens for GitHub push webhooks on the `featurethon` branch of the featurethon repos and posts
to Slack with rare achievement badges, commit milestones, and a random bonus (meme, joke,
dad joke, useless fact, advice, dog, or http.cat).

| Repo | Team |
| --- | --- |
| `boutline` | 🥊 Boutline |
| `inspirate-consulting` | 💡 Inspirate Consulting |
| `birdie-and-claire` | 🐦 Birdie & Claire |
| `tomoji` | 🍅 Tomoji |
| `website`, `finops`, `apportal` | 🛠️ Infra (one shared score) |

## Running

Run everything from this directory (from the repo root, `bun run sample` falls through to macOS's `sample` profiler):

```bash
cd featurethon/fall_2026/push-bot
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

## Deploy

Runs on the shared Generate droplet (`deploy@159.65.222.225`) in `~/featurethon-push-bot`, behind the droplet's
Caddy at `https://featurethon-push-bot.boutline-preview.generatenu.com`. Secrets live in `~/featurethon-push-bot/bot.env`
there (`SLACK_WEBHOOK`, `GITHUB_WEBHOOK_SECRET`, `PUSH_BOT_DOMAIN`). The scoreboard persists in the
`featurethon-push-bot_scoreboard` volume.

To redeploy, commit first (this ships the committed code, not your working tree), then from the repo root:

```bash
git archive HEAD:featurethon/fall_2026/push-bot | ssh deploy@159.65.222.225 'set -e
  cd ~/featurethon-push-bot && rm -rf app.new && mkdir app.new && tar -x -C app.new
  rm -rf app && mv app.new app && cp app/docker-compose.yml .
  docker compose --env-file bot.env up -d --build'
```

(Avoid macOS's built-in `rsync` here: it mangles relative remote paths.)

Logs: `ssh deploy@159.65.222.225 docker logs --tail 100 featurethon-push-bot`

## Where to add content

- `src/flavor.ts` — titles, descriptors, verbs, milestone lines
- `src/achievements.ts` — badge rules (each is a function: contributor → badge or nothing)
- `src/content.ts` — bonus content sources and their weights
- `src/teams.ts` — repo → team mapping
